import type { FastifyInstance } from "fastify";
import { withRlsUser } from "../db/client.js";

export async function statusRoutes(app: FastifyInstance) {
  app.get("/v1/status", async (req) => {
    const { userId, tier } = req.auth!;

    const rows = await withRlsUser(userId, async (tx) => {
      return await tx`
        select event_type, reason_code, reason_detail, created_at
        from trade_events
        where event_type in ('HALT','INFO','REJECT')
        order by created_at desc
        limit 1
      `;
    });
    const last = (rows as unknown as Array<{ event_type: string; reason_code: string | null; reason_detail: string | null; created_at: string }>)[0] ?? null;

    return {
      tier,
      autoTrading: last?.event_type === "HALT" ? "halted" : "unknown",
      lastEvent: last
        ? {
            type: last.event_type,
            reasonCode: last.reason_code,
            reasonDetail: last.reason_detail,
            createdAt: last.created_at
          }
        : null
    };
  });
}

