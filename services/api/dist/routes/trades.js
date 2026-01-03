import { z } from "zod";
import { withRlsUser } from "../db/client.js";
import { assertTimeframeAllowed } from "../policy/timeframes.js";
const EventsQuery = z.object({
    symbol: z.string().min(1).default("BTCUSDT"),
    timeframe: z.string().min(1).default("1m"),
    from: z.coerce.number().int().optional(), // unix seconds
    to: z.coerce.number().int().optional() // unix seconds
});
export async function tradeRoutes(app) {
    app.get("/v1/trades/events", async (req) => {
        const { symbol, timeframe, from, to } = EventsQuery.parse(req.query);
        const { userId, tier } = req.auth;
        assertTimeframeAllowed(tier, timeframe);
        const rows = await withRlsUser(userId, async (tx) => {
            // For chart proof: return ordered events; client can pair ENTRY/EXIT by bot_id + time proximity.
            // Next step: add trade_id to group explicitly.
            if (from && to) {
                return await tx `
          select id, symbol, timeframe, event_type, side, price, qty, pnl, reason_code, reason_detail, exchange_ts, created_at
          from trade_events
          where symbol = ${symbol}
            and timeframe = ${timeframe}
            and created_at between to_timestamp(${from}) and to_timestamp(${to})
          order by created_at asc
          limit 2000
        `;
            }
            return await tx `
        select id, symbol, timeframe, event_type, side, price, qty, pnl, reason_code, reason_detail, exchange_ts, created_at
        from trade_events
        where symbol = ${symbol}
          and timeframe = ${timeframe}
        order by created_at desc
        limit 500
      `;
        });
        const typed = rows;
        return typed.map((e) => ({
            id: e.id,
            symbol: e.symbol,
            timeframe: e.timeframe,
            type: e.event_type,
            side: e.side,
            price: e.price ? Number(e.price) : null,
            qty: e.qty ? Number(e.qty) : null,
            pnl: e.pnl ? Number(e.pnl) : null,
            reasonCode: e.reason_code,
            reasonDetail: e.reason_detail,
            exchangeTs: e.exchange_ts,
            createdAt: e.created_at
        }));
    });
    app.get("/v1/policy/timeframes", async (req) => {
        const { tier } = req.auth;
        const { allowedTimeframesForTier } = await import("../policy/timeframes.js");
        return { tier, allowed: allowedTimeframesForTier(tier) };
    });
}
