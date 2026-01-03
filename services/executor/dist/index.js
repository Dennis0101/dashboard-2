import postgres from "postgres";
import pino from "pino";
import { decryptExchangeKeyPayload } from "./security/keyVault.js";
import { checkRisk, RiskLimitsSchema } from "./risk/limits.js";
import { NoopLockProvider } from "./locks/lock.js";
const log = pino({ level: process.env.NODE_ENV === "production" ? "info" : "debug" });
const DATABASE_URL = process.env.DATABASE_URL;
const MASTER_KEY = process.env.KEY_VAULT_MASTER_KEY_B64;
if (!DATABASE_URL) {
    log.error("DATABASE_URL is required");
    process.exit(1);
}
const sql = postgres(DATABASE_URL, { max: 5, debug: false });
// NOTE: This is a skeleton that demonstrates the “decrypt only at execution” rule.
// Next step: implement exchange adapters, idempotency, locks, and full position reconciliation.
async function main() {
    log.info({ msg: "executor_start" });
    const lockProvider = new NoopLockProvider();
    const limits = RiskLimitsSchema.parse({
        maxDailyLossUsd: Number(process.env.MAX_DAILY_LOSS_USD ?? 50),
        maxOpenPositions: Number(process.env.MAX_OPEN_POSITIONS ?? 3),
        maxNotionalUsd: Number(process.env.MAX_NOTIONAL_USD ?? 500)
    });
    // Example: pick the newest active key for a user and decrypt only in memory.
    // In production: keys are selected per bot/account and never logged.
    const userId = process.env.EXECUTOR_USER_ID;
    if (!userId) {
        log.warn({ msg: "no_EXECUTOR_USER_ID_set", note: "Set EXECUTOR_USER_ID to run a safe local sanity check." });
        return;
    }
    const lock = await lockProvider.acquire(`executor:user:${userId}`, 30_000);
    if (!lock) {
        log.warn({ msg: "lock_busy", userId });
        return;
    }
    await sql.begin(async (tx) => {
        await tx `select set_config('app.user_id', ${userId}, true)`;
        // Risk gate (placeholder state). In production, compute from exchange positions + DB.
        const risk = checkRisk(limits, { currentDailyPnlUsd: 0, openPositions: 0, currentNotionalUsd: 0 });
        if (!risk.ok) {
            // Fail-safe: emit HALT event (append-only) so UI can show "why we stopped".
            await tx `
        insert into trade_events (user_id, symbol, timeframe, event_type, reason_code, reason_detail)
        values (${userId}::uuid, 'BTCUSDT', '1m', 'HALT', ${risk.reason}, 'Risk limits triggered. Auto-trading halted.')
      `;
            log.warn({ msg: "halted_by_risk", reason: risk.reason });
            return;
        }
        const rows = await tx `
      select id, exchange, encrypted_payload
      from exchange_api_keys
      where revoked_at is null
      order by created_at desc
      limit 1
    `;
        const row = rows[0];
        if (!row) {
            log.info({ msg: "no_active_key_found" });
            return;
        }
        const payload = decryptExchangeKeyPayload(row.encrypted_payload, MASTER_KEY);
        // CRITICAL: never log payload.apiKey/apiSecret.
        log.info({ msg: "decrypted_key_ready_in_memory", exchange: row.exchange, keyId: row.id });
        // Placeholder: execute order here using payload (in memory only)
        // ... placeOrder(payload) ...
    });
    await lockProvider.release(lock);
}
main()
    .catch((e) => {
    log.error({ msg: "executor_crash", err: e instanceof Error ? { message: e.message, name: e.name } : { message: "unknown" } });
    process.exit(1);
})
    .finally(async () => {
    await sql.end({ timeout: 5 });
});
