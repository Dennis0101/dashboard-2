import { z } from "zod";
import { verifyProviderIdToken } from "../auth/verifyIdToken.js";
import { upsertUser } from "../db/users.js";
import { signSessionJwt } from "../auth/jwt.js";
import crypto from "node:crypto";
const LoginBody = z.object({
    provider: z.enum(["google", "apple"]),
    idToken: z.string().min(1)
});
function stableUserIdFromProvider(provider, subject) {
    // deterministic uuid v4 derived from sha256(provider:subject) to keep dev simple.
    // production: store app_users with generated uuid and stable mapping.
    const digest = crypto.createHash("sha256").update(`${provider}:${subject}`, "utf8").digest();
    const b = Buffer.from(digest.subarray(0, 16));
    b[6] = ((b[6] ?? 0) & 0x0f) | 0x40;
    b[8] = ((b[8] ?? 0) & 0x3f) | 0x80;
    const hex = b.toString("hex");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
export async function authRoutes(app) {
    app.post("/auth/login", { config: { public: true } }, async (req, reply) => {
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
        const tier = "basic";
        const secret = cfg.JWT_SECRET ?? "";
        if (!secret || secret.length < 16)
            throw new Error("JWT_SECRET must be set (>=16 chars)");
        const sessionToken = await signSessionJwt({ secret, userId, tier, expiresIn: "7d" });
        return reply.send({
            sessionToken,
            tier,
            user: { provider: verified.provider, subject: verified.subject, email: verified.email ?? null }
        });
    });
}
