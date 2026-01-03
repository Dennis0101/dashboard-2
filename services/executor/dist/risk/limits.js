import { z } from "zod";
export const RiskLimitsSchema = z.object({
    maxDailyLossUsd: z.number().positive(),
    maxOpenPositions: z.number().int().positive(),
    maxNotionalUsd: z.number().positive()
});
export function checkRisk(limits, state) {
    if (state.currentDailyPnlUsd <= -Math.abs(limits.maxDailyLossUsd))
        return { ok: false, reason: "max_daily_loss_exceeded" };
    if (state.openPositions >= limits.maxOpenPositions)
        return { ok: false, reason: "max_open_positions_exceeded" };
    if (state.currentNotionalUsd >= limits.maxNotionalUsd)
        return { ok: false, reason: "max_notional_exceeded" };
    return { ok: true };
}
