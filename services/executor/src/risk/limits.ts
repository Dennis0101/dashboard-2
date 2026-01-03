import { z } from "zod";

export const RiskLimitsSchema = z.object({
  maxDailyLossUsd: z.number().positive(),
  maxOpenPositions: z.number().int().positive(),
  maxNotionalUsd: z.number().positive()
});

export type RiskLimits = z.infer<typeof RiskLimitsSchema>;

export type RiskCheckInput = {
  currentDailyPnlUsd: number; // realized + unrealized snapshot (executor computed)
  openPositions: number;
  currentNotionalUsd: number;
};

export function checkRisk(limits: RiskLimits, state: RiskCheckInput): { ok: true } | { ok: false; reason: string } {
  if (state.currentDailyPnlUsd <= -Math.abs(limits.maxDailyLossUsd)) return { ok: false, reason: "max_daily_loss_exceeded" };
  if (state.openPositions >= limits.maxOpenPositions) return { ok: false, reason: "max_open_positions_exceeded" };
  if (state.currentNotionalUsd >= limits.maxNotionalUsd) return { ok: false, reason: "max_notional_exceeded" };
  return { ok: true };
}

