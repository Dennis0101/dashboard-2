import { z } from "zod";
import { withRlsUser } from "../db/client.js";
import { encryptExchangeKeyPayload } from "../security/keyVault.js";
import { maskApiKeyHint } from "../security/redact.js";
const CreateBody = z.object({
    exchange: z.enum(["bybit", "bitget"]),
    apiKey: z.string().min(1),
    apiSecret: z.string().min(1),
    passphrase: z.string().optional()
});
export async function exchangeKeyRoutes(app) {
    app.post("/v1/exchange-keys", async (req, reply) => {
        const body = CreateBody.parse(req.body);
        const userId = req.auth.userId;
        if (body.exchange === "bitget" && !body.passphrase) {
            throw app.httpErrors.badRequest("bitget_passphrase_required");
        }
        const maskedHint = maskApiKeyHint(body.apiKey);
        const encrypted = encryptExchangeKeyPayload({ apiKey: body.apiKey, apiSecret: body.apiSecret, passphrase: body.passphrase }, app.config.KEY_VAULT_MASTER_KEY_B64);
        // Store encrypted; NEVER return plaintext.
        const row = await withRlsUser(userId, async (tx) => {
            const rows = await tx `insert into exchange_api_keys (user_id, exchange, encrypted_payload, masked_hint)
        values (${userId}::uuid, ${body.exchange}, ${tx.json(encrypted)}, ${maskedHint})
        returning id, exchange, masked_hint, created_at`;
            return rows[0];
        });
        return reply.send({
            id: row.id,
            exchange: row.exchange,
            maskedHint: row.masked_hint,
            createdAt: row.created_at
        });
    });
    app.get("/v1/exchange-keys", async (req) => {
        const userId = req.auth.userId;
        const rows = await withRlsUser(userId, async (tx) => {
            return await tx `
        select id, exchange, masked_hint, created_at, revoked_at
        from exchange_api_keys
        where revoked_at is null
        order by created_at desc
      `;
        });
        const typed = rows;
        return typed.map((r) => ({
            id: r.id,
            exchange: r.exchange,
            maskedHint: r.masked_hint,
            createdAt: r.created_at,
            revokedAt: r.revoked_at
        }));
    });
}
