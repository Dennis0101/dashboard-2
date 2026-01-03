import Fastify from "fastify";
import helmet from "@fastify/helmet";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import sensible from "@fastify/sensible";
import { loadConfig } from "./config.js";
import { redactObject } from "./security/redact.js";
import { healthRoutes } from "./routes/health.js";
import { authRoutes } from "./routes/auth.js";
import { exchangeKeyRoutes } from "./routes/exchangeKeys.js";
import { authPlugin } from "./auth/authPlugin.js";
import { tradeRoutes } from "./routes/trades.js";
import { statusRoutes } from "./routes/status.js";

declare module "fastify" {
  interface FastifyInstance {
    config: ReturnType<typeof loadConfig>;
  }
}

const config = loadConfig(process.env);

export async function buildServer() {
  const app = Fastify({
    logger: {
      level: config.NODE_ENV === "production" ? "info" : "debug",
      serializers: {
        req(req) {
          return {
            method: req.method,
            url: req.url,
            headers: redactObject(req.headers)
          };
        }
      }
    }
  });

  app.decorate("config", config);

  await app.register(sensible);
  await app.register(helmet, { global: true });
  await app.register(cors, { origin: true, credentials: true });
  await app.register(rateLimit, { max: 300, timeWindow: "1 minute" });

  await app.register(authPlugin);

  await app.register(healthRoutes);
  await app.register(authRoutes);
  await app.register(exchangeKeyRoutes);
  await app.register(tradeRoutes);
  await app.register(statusRoutes);

  app.setErrorHandler((err, _req, reply) => {
    // Never leak sensitive payloads.
    const e = err instanceof Error ? err : new Error("unknown_error");
    app.log.error({
      err: {
        message: e.message,
        name: e.name,
        stack: config.NODE_ENV === "production" ? undefined : e.stack
      }
    });
    reply.status(500).send({ error: "internal_error" });
  });

  return app;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const app = await buildServer();
  await app.listen({ port: config.PORT, host: "0.0.0.0" });
}

