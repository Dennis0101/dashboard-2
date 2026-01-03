import "fastify";

declare module "fastify" {
  interface FastifyRequest {
    userId?: string;
  }

  interface FastifyContextConfig {
    public?: boolean;
  }
}

