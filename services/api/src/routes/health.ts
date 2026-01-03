import type { FastifyInstance } from "fastify";

export async function healthRoutes(app: FastifyInstance) {
  app.get("/health", { config: { public: true } }, async () => ({ ok: true }));
}

