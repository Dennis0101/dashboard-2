import { verifySessionJwt } from "./jwt.js";
import { SubscriptionTierSchema } from "./authTypes.js";
export const authPlugin = async (app) => {
    app.decorateRequest("auth", undefined);
    app.addHook("preHandler", async (req) => {
        // Allow unauthenticated endpoints explicitly by checking route config
        const cfg = req.routeOptions.config;
        const isPublic = typeof cfg === "object" && cfg !== null && cfg.public === true;
        if (isPublic)
            return;
        const auth = req.headers.authorization;
        if (!auth?.startsWith("Bearer "))
            throw app.httpErrors.unauthorized();
        const token = auth.slice("Bearer ".length);
        const secret = app.config.JWT_SECRET;
        if (!secret)
            throw new Error("JWT_SECRET is required");
        const claims = await verifySessionJwt({ secret, token });
        req.auth = { userId: claims.sub, tier: SubscriptionTierSchema.parse(claims.tier) };
    });
};
