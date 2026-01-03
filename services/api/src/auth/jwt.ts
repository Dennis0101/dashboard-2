import { SignJWT, jwtVerify } from "jose";
import { z } from "zod";
import type { SubscriptionTier } from "./authTypes.js";

const SessionClaimsSchema = z.object({
  sub: z.string().uuid(),
  tier: z.enum(["basic", "pro", "vip"])
});

export type SessionClaims = z.infer<typeof SessionClaimsSchema>;

function secretKey(secret: string): Uint8Array {
  return new TextEncoder().encode(secret);
}

export async function signSessionJwt(params: {
  secret: string;
  userId: string;
  tier: SubscriptionTier;
  expiresIn: string; // e.g. "15m", "7d"
}): Promise<string> {
  const { secret, userId, tier, expiresIn } = params;
  return await new SignJWT({ tier })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secretKey(secret));
}

export async function verifySessionJwt(params: { secret: string; token: string }): Promise<SessionClaims> {
  const { secret, token } = params;
  const { payload } = await jwtVerify(token, secretKey(secret), { algorithms: ["HS256"] });
  const sub = payload.sub ? String(payload.sub) : "";
  const tier = payload.tier ? String(payload.tier) : "";
  return SessionClaimsSchema.parse({ sub, tier });
}

