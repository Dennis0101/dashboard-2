export type Side = "LONG" | "SHORT";

export type PnlBreakdown = {
  realizedPnl: number;
  fees: number;
  funding: number;
  netPnl: number;
};

// USDT-margined linear futures (simplified):
// realizedPnl = (exit - entry) * qty for LONG, (entry - exit) * qty for SHORT.
// fees/funding are provided by executor/exchange fills; server stores and exposes transparently.
export function calcLinearFuturesPnl(params: {
  side: Side;
  entryPrice: number;
  exitPrice: number;
  qty: number;
  fees?: number;
  funding?: number;
}): PnlBreakdown {
  const { side, entryPrice, exitPrice, qty } = params;
  const fees = params.fees ?? 0;
  const funding = params.funding ?? 0;
  const realizedPnl = (side === "LONG" ? exitPrice - entryPrice : entryPrice - exitPrice) * qty;
  const netPnl = realizedPnl - fees + funding;
  return { realizedPnl, fees, funding, netPnl };
}

