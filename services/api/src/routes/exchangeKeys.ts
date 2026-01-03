import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { withRlsUser } from "../db/client.js";
import { parseDevSessionToken } from "../auth/devSession.js";
import { encryptExchangeKeyPayload } from "../security/keyVault.js";
import { maskApiKeyHint } from "../security/redact.js";

const CreateBody = z.object({
  exchange: z.string().min(1),
  apiKey: z.string().min(1),
  apiSecret: z.string().min(1),
  passphrase: z.string().optional()
});

export async function exchangeKeyRoutes(app: FastifyInstance) {
  // Dev auth for now: "Bearer dev-session:<provider>:<subject>"
  app.addHook("preHandler", async (req) => {
    const auth = req.headers.authorization;
    if (!auth?.startsWith("Bearer ")) throw app.httpErrors.unauthorized();
    const token = auth.slice("Bearer ".length);
    if (!token.startsWith("dev-session:")) throw app.httpErrors.unauthorized();

    // Keep parsing minimal here; real auth will issue signed JWT.
    req.userId = parseDevSessionToken(token)?.userId;
    if (!req.userId) throw app.httpErrors.unauthorized();
  });

  app.post("/v1/exchange-keys", async (req, reply) => {
    const body = CreateBody.parse(req.body);
    const userId = req.userId!;

    const maskedHint = maskApiKeyHint(body.apiKey);
    const encrypted = encryptExchangeKeyPayload(
      { apiKey: body.apiKey, apiSecret: body.apiSecret, passphrase: body.passphrase },
      app.config.KEY_VAULT_MASTER_KEY_B64
    );

    // Store encrypted; NEVER return plaintext.
    const row = await withRlsUser(userId, async (tx) => {
      const rows = await tx`insert into exchange_api_keys (user_id, exchange, encrypted_payload, masked_hint)
        values (${userId}::uuid, ${body.exchange}, ${tx.json(encrypted)}, ${maskedHint})
        returning id, exchange, masked_hint, created_at`;
      return rows[0] as { id: string; exchange: string; masked_hint: string; created_at: string };
    });

    return reply.send({
      id: row.id,
      exchange: row.exchange,
      maskedHint: row.masked_hint,
      createdAt: row.created_at
    });
  });

  app.get("/v1/exchange-keys", async (req) => {
    const userId = req.userId!;
    const rows = await withRlsUser(userId, async (tx) => {
      return await tx`
        select id, exchange, masked_hint, created_at, revoked_at
        from exchange_api_keys
        where revoked_at is null
        order by created_at desc
      `;
    });
    const typed = rows as unknown as Array<{
      id: string;
      exchange: string;
      masked_hint: string;
      created_at: string;
      revoked_at: string | null;
    }>;
    return typed.map((r) => ({
      id: r.id,
      exchange: r.exchange,
      maskedHint: r.masked_hint,
      createdAt: r.created_at,
      revokedAt: r.revoked_at
    }));
  });
}

