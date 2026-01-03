import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { withRlsUser } from "../db/client.js";
import { assertTimeframeAllowed } from "../policy/timeframes.js";

const EventsQuery = z.object({
  symbol: z.string().min(1).default("BTCUSDT"),
  timeframe: z.string().min(1).default("1m"),
  from: z.coerce.number().int().optional(), // unix seconds
  to: z.coerce.number().int().optional() // unix seconds
});

const TradesQuery = z.object({
  symbol: z.string().min(1).optional(),
  timeframe: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(500).default(100)
});

export async function tradeRoutes(app: FastifyInstance) {
  // v1: list trades (grouped proof)
  app.get("/v1/trades", async (req) => {
    const q = TradesQuery.parse(req.query);
    const { userId, tier } = req.auth!;
    if (q.timeframe) assertTimeframeAllowed(tier, q.timeframe);

    const rows = await withRlsUser(userId, async (tx) => {
      if (q.symbol && q.timeframe) {
        return await tx`
          select id, symbol, timeframe, side, status,
                 entry_ts, entry_price, exit_ts, exit_price,
                 qty, realized_pnl, fees, funding, net_pnl,
                 entry_reason_detail, exit_reason_detail,
                 created_at, updated_at
          from trades
          where symbol = ${q.symbol}
            and timeframe = ${q.timeframe}
          order by created_at desc
          limit ${q.limit}
        `;
      }
      if (q.symbol) {
        return await tx`
          select id, symbol, timeframe, side, status,
                 entry_ts, entry_price, exit_ts, exit_price,
                 qty, realized_pnl, fees, funding, net_pnl,
                 entry_reason_detail, exit_reason_detail,
                 created_at, updated_at
          from trades
          where symbol = ${q.symbol}
          order by created_at desc
          limit ${q.limit}
        `;
      }
      return await tx`
        select id, symbol, timeframe, side, status,
               entry_ts, entry_price, exit_ts, exit_price,
               qty, realized_pnl, fees, funding, net_pnl,
               entry_reason_detail, exit_reason_detail,
               created_at, updated_at
        from trades
        order by created_at desc
        limit ${q.limit}
      `;
    });

    const typed = rows as unknown as Array<{
      id: string;
      symbol: string;
      timeframe: string;
      side: "LONG" | "SHORT";
      status: "OPEN" | "CLOSED" | "HALTED" | "REJECTED";
      entry_ts: string | null;
      entry_price: string | null;
      exit_ts: string | null;
      exit_price: string | null;
      qty: string | null;
      realized_pnl: string | null;
      fees: string | null;
      funding: string | null;
      net_pnl: string | null;
      entry_reason_detail: string | null;
      exit_reason_detail: string | null;
      created_at: string;
      updated_at: string;
    }>;

    return typed.map((t) => ({
      id: t.id,
      symbol: t.symbol,
      timeframe: t.timeframe,
      side: t.side,
      status: t.status,
      entry: t.entry_ts
        ? { ts: t.entry_ts, price: t.entry_price ? Number(t.entry_price) : null }
        : null,
      exit: t.exit_ts
        ? { ts: t.exit_ts, price: t.exit_price ? Number(t.exit_price) : null }
        : null,
      qty: t.qty ? Number(t.qty) : null,
      pnl: {
        realized: t.realized_pnl ? Number(t.realized_pnl) : null,
        fees: t.fees ? Number(t.fees) : null,
        funding: t.funding ? Number(t.funding) : null,
        net: t.net_pnl ? Number(t.net_pnl) : null
      },
      entryReason: t.entry_reason_detail,
      exitReason: t.exit_reason_detail,
      createdAt: t.created_at,
      updatedAt: t.updated_at
    }));
  });

  // v1: trade detail (+ underlying events) for full transparency
  app.get("/v1/trades/:tradeId", async (req) => {
    const { tradeId } = z.object({ tradeId: z.string().uuid() }).parse(req.params);
    const { userId } = req.auth!;

    const result = await withRlsUser(userId, async (tx) => {
      const tradeRows = await tx`select * from trades where id = ${tradeId}::uuid limit 1`;
      const eventRows = await tx`
        select id, event_type, side, price, qty, pnl, reason_code, reason_detail, exchange_ts, created_at
        from trade_events
        where trade_id = ${tradeId}::uuid
        order by created_at asc
        limit 2000
      `;
      return { trade: tradeRows[0] ?? null, events: eventRows };
    });

    return result;
  });

  app.get("/v1/trades/events", async (req) => {
    const { symbol, timeframe, from, to } = EventsQuery.parse(req.query);
    const { userId, tier } = req.auth!;

    assertTimeframeAllowed(tier, timeframe);

    const rows = await withRlsUser(userId, async (tx) => {
      // For chart proof: return ordered events; client can pair ENTRY/EXIT by bot_id + time proximity.
      // Next step: add trade_id to group explicitly.
      if (from && to) {
        return await tx`
          select id, symbol, timeframe, event_type, side, price, qty, pnl, reason_code, reason_detail, exchange_ts, created_at
          from trade_events
          where symbol = ${symbol}
            and timeframe = ${timeframe}
            and created_at between to_timestamp(${from}) and to_timestamp(${to})
          order by created_at asc
          limit 2000
        `;
      }
      return await tx`
        select id, symbol, timeframe, event_type, side, price, qty, pnl, reason_code, reason_detail, exchange_ts, created_at
        from trade_events
        where symbol = ${symbol}
          and timeframe = ${timeframe}
        order by created_at desc
        limit 500
      `;
    });

    const typed = rows as unknown as Array<{
      id: string;
      symbol: string;
      timeframe: string;
      event_type: "ENTRY" | "EXIT" | "REJECT" | "HALT" | "INFO";
      side: "LONG" | "SHORT" | null;
      price: string | null;
      qty: string | null;
      pnl: string | null;
      reason_code: string | null;
      reason_detail: string | null;
      exchange_ts: string | null;
      created_at: string;
    }>;

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
    const { tier } = req.auth!;
    const { allowedTimeframesForTier } = await import("../policy/timeframes.js");
    return { tier, allowed: allowedTimeframesForTier(tier) };
  });
}

