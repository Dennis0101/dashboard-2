import { SignJWT, jwtVerify } from "jose";
import { z } from "zod";
const SessionClaimsSchema = z.object({
    sub: z.string().uuid(),
    tier: z.enum(["basic", "pro", "vip"])
});
function secretKey(secret) {
    return new TextEncoder().encode(secret);
}
export async function signSessionJwt(params) {
    const { secret, userId, tier, expiresIn } = params;
    return await new SignJWT({ tier })
        .setProtectedHeader({ alg: "HS256", typ: "JWT" })
        .setSubject(userId)
        .setIssuedAt()
        .setExpirationTime(expiresIn)
        .sign(secretKey(secret));
}
export async function verifySessionJwt(params) {
    const { secret, token } = params;
    const { payload } = await jwtVerify(token, secretKey(secret), { algorithms: ["HS256"] });
    const sub = payload.sub ? String(payload.sub) : "";
    const tier = payload.tier ? String(payload.tier) : "";
    return SessionClaimsSchema.parse({ sub, tier });
}
