// Augments Fastify's internal FastifyRequest (used by route handler inference)
// with app-specific properties. The barrel (fastify.ts) augments the subpath.
// This file augments the main 'fastify' module so Fastify's own type inference
// picks up userId on inferred handler parameters.
export {};

declare module 'fastify' {
  interface FastifyRequest {
    /** Injected by requireAuth preHandler on every authenticated route. */
    userId?: string;
  }
}
