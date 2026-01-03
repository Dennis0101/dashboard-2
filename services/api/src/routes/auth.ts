import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { verifyProviderIdToken } from "../auth/verifyIdToken.js";
import { parseDevSessionToken } from "../auth/devSession.js";
import { upsertUser } from "../db/users.js";

const LoginBody = z.object({
  provider: z.enum(["google", "apple"]),
  idToken: z.string().min(1)
});

// NOTE: Session/JWT issuance is intentionally minimal here.
// Next step: map provider subject -> internal user, store, and issue signed JWT for app.
export async function authRoutes(app: FastifyInstance) {
  app.post("/auth/login", async (req, reply) => {
    const cfg = app.config;
    const body = LoginBody.parse(req.body);

    const verified = await verifyProviderIdToken({
      provider: body.provider,
      idToken: body.idToken,
      audience: process.env.AUTH_AUDIENCE,
      acceptUnsignedDevTokens: cfg.AUTH_ACCEPT_UNSIGNED_DEV_TOKENS
    });

    // For now we return a "dev session token".
    // Production: issue your own JWT (HS/RS) and store refresh tokens.
    const sessionToken = `dev-session:${verified.provider}:${verified.subject}`;

    // Ensure internal user exists when DB is configured.
    const userId = parseDevSessionToken(sessionToken)?.userId;
    if (userId) {
      await upsertUser({
        userId,
        provider: verified.provider,
        providerSubject: verified.subject,
        email: verified.email
      });
    }

    return reply.send({
      sessionToken,
      user: { provider: verified.provider, subject: verified.subject, email: verified.email ?? null }
    });
  });
}

