import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { verifyProviderIdToken } from "../auth/verifyIdToken.js";
import { upsertUser } from "../db/users.js";
import { signSessionJwt } from "../auth/jwt.js";
import type { SubscriptionTier } from "../auth/authTypes.js";
import crypto from "node:crypto";
import { generateRefreshToken, hashRefreshToken, rotateRefreshToken, insertRefreshToken, revokeRefreshToken } from "../auth/refreshTokens.js";
import { sql } from "../db/client.js";

const LoginBody = z.object({
  provider: z.enum(["google", "apple"]),
  idToken: z.string().min(1),
  deviceId: z.string().min(1).optional()
});

function stableUserIdFromProvider(provider: string, subject: string): string {
  // deterministic uuid v4 derived from sha256(provider:subject) to keep dev simple.
  // production: store app_users with generated uuid and stable mapping.
  const digest = crypto.createHash("sha256").update(`${provider}:${subject}`, "utf8").digest();
  const b = Buffer.from(digest.subarray(0, 16));
  b[6] = ((b[6] ?? 0) & 0x0f) | 0x40;
  b[8] = ((b[8] ?? 0) & 0x3f) | 0x80;
  const hex = b.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export async function authRoutes(app: FastifyInstance) {
  app.post(
    "/auth/login",
    { config: { public: true } },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const cfg = app.config;
      const body = LoginBody.parse(req.body);

    const verified = await verifyProviderIdToken({
      provider: body.provider,
      idToken: body.idToken,
      audience: process.env.AUTH_AUDIENCE,
      acceptUnsignedDevTokens: cfg.AUTH_ACCEPT_UNSIGNED_DEV_TOKENS
    });

    const userId = stableUserIdFromProvider(verified.provider, verified.subject);

    // Ensure internal user exists when DB is configured.
    await upsertUser({
      userId,
      provider: verified.provider,
      providerSubject: verified.subject,
      email: verified.email
    });

    // TODO: read tier from DB; for now it defaults to basic.
    const tier: SubscriptionTier = "basic";
    const secret = cfg.JWT_SECRET ?? "";
    if (!secret || secret.length < 16) throw new Error("JWT_SECRET must be set (>=16 chars)");
    const sessionToken = await signSessionJwt({ secret, userId, tier, expiresIn: "15m" });

    // Refresh token (hashed storage)
    const pepper = cfg.REFRESH_TOKEN_PEPPER ?? "";
    if (!pepper || pepper.length < 16) throw new Error("REFRESH_TOKEN_PEPPER must be set (>=16 chars)");
    const refreshToken = generateRefreshToken();
    const refreshHash = hashRefreshToken(refreshToken, pepper);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30); // 30 days
    if (sql) {
      await sql.begin(async (tx) => {
        await tx`select set_config('app.user_id', ${userId}, true)`;
        await insertRefreshToken({ tx, userId, tokenHash: refreshHash, deviceId: body.deviceId, expiresAt });
      });
    }

      return reply.send({
        sessionToken,
      refreshToken,
        tier,
        user: { provider: verified.provider, subject: verified.subject, email: verified.email ?? null }
      });
    }
  );

  app.post(
    "/auth/refresh",
    { config: { public: true } },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const cfg = app.config;
      const body = z
        .object({ refreshToken: z.string().min(1), deviceId: z.string().min(1).optional() })
        .parse(req.body);

      const secret = cfg.JWT_SECRET ?? "";
      const pepper = cfg.REFRESH_TOKEN_PEPPER ?? "";
      if (!secret || secret.length < 16) throw new Error("JWT_SECRET must be set (>=16 chars)");
      if (!pepper || pepper.length < 16) throw new Error("REFRESH_TOKEN_PEPPER must be set (>=16 chars)");

      if (!sql) throw new Error("DATABASE_URL is required for refresh flow");

      const oldHash = hashRefreshToken(body.refreshToken, pepper);
      // Find token row + user_id
      const result = await sql.begin(async (tx) => {
        const rows = await tx`
          select user_id
          from refresh_tokens
          where token_hash = ${oldHash}
            and revoked_at is null
            and expires_at > now()
          limit 1
        `;
        const row = rows[0] as { user_id: string } | undefined;
        if (!row) throw app.httpErrors.unauthorized();

        const userId = row.user_id;
        await tx`select set_config('app.user_id', ${userId}, true)`;

        // Rotate
        const newRefresh = generateRefreshToken();
        const newHash = hashRefreshToken(newRefresh, pepper);
        const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
        await rotateRefreshToken({ tx, userId, oldTokenHash: oldHash, newTokenHash: newHash, deviceId: body.deviceId, expiresAt });

        const tier: SubscriptionTier = "basic";
        const sessionToken = await signSessionJwt({ secret, userId, tier, expiresIn: "15m" });
        return { sessionToken, refreshToken: newRefresh, tier };
      });

      return reply.send(result);
    }
  );

  app.post(
    "/auth/logout",
    { config: { public: true } },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const cfg = app.config;
      const body = z.object({ refreshToken: z.string().min(1) }).parse(req.body);
      const pepper = cfg.REFRESH_TOKEN_PEPPER ?? "";
      if (!pepper || pepper.length < 16) throw new Error("REFRESH_TOKEN_PEPPER must be set (>=16 chars)");
      if (!sql) return reply.send({ ok: true });
      const hash = hashRefreshToken(body.refreshToken, pepper);
      await sql.begin(async (tx) => {
        await revokeRefreshToken({ tx, tokenHash: hash });
      });
      return reply.send({ ok: true });
    }
  );
}

