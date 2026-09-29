/**
 * modules/health/health.routes.ts
 *
 * Operational endpoints — not part of the domain API.
 * These routes are intentionally kept outside /api/v1 so infrastructure tools
 * (load balancers, container orchestrators, uptime monitors) can reach them
 * without knowing about API versioning or authentication.
 *
 * Endpoints:
 *
 *   GET /healthz        — legacy liveness (kept for backward compat)
 *   GET /health         — liveness: is the process alive and able to respond?
 *   GET /ready          — readiness: are all critical dependencies reachable?
 *   GET /metrics        — internal metrics snapshot (see auth rules below)
 *
 * /metrics authentication rules:
 *
 *   METRICS_SECRET set     → always require `x-metrics-key: <secret>` header
 *   METRICS_SECRET not set + NODE_ENV=production → deny (403)
 *   METRICS_SECRET not set + NODE_ENV≠production  → allow (dev convenience)
 *
 * Set METRICS_SECRET via environment variable or Replit Secret.
 * Example: METRICS_SECRET=a-long-random-string
 */

import type { FastifyInstance } from '../../shared/types/fastify';
import { db } from '@workspace/db';
import { sql } from 'drizzle-orm';
import { metrics } from '../../observability';

export async function healthRoutes(app: FastifyInstance): Promise<void> {
  // ── Legacy: keep /healthz alive ─────────────────────────────────────────────
  app.get('/healthz', async (_request, reply) => {
    return reply.send({ status: 'ok' });
  });

  // ── GET /health — liveness probe ────────────────────────────────────────────
  //
  // Answers: "Is the process alive?"
  //
  // Rule: NEVER do I/O here. A liveness probe that hangs on a DB call will
  // cause the container orchestrator to restart healthy pods when the DB is slow.
  // If this endpoint doesn't respond, the process should be killed and restarted.
  app.get('/health', async (_request, reply) => {
    return reply.send({
      status: 'ok',
      timestamp: new Date().toISOString(),
    });
  });

  // ── GET /ready — readiness probe ────────────────────────────────────────────
  //
  // Answers: "Is the process ready to receive traffic?"
  //
  // Returns 200 only when ALL critical dependencies are healthy.
  // Returns 503 when any critical dependency is down — the load balancer should
  // stop routing traffic to this instance until it recovers.
  //
  // Dependency classification:
  //   critical  → failure returns 503 (database)
  //   optional  → failure is reported but doesn't affect the status code (Redis — future)
  app.get('/ready', async (_request, reply) => {
    const checks: Record<string, {
      ok: boolean;
      latencyMs?: number;
      note?: string;
      error?: string;
    }> = {};

    // Database check — must be fast; use a direct query, not ORM overhead.
    const dbStart = Date.now();
    try {
      await db.execute(sql`SELECT 1`);
      checks.database = { ok: true, latencyMs: Date.now() - dbStart };
    } catch (err) {
      checks.database = {
        ok: false,
        latencyMs: Date.now() - dbStart,
        error: err instanceof Error ? err.message : 'Unknown error',
      };
    }

    // Redis check — placeholder. When Redis is added:
    //   1. Import the Redis client.
    //   2. Replace this with: await redis.ping() inside try/catch.
    //   3. Mark as critical (ok: false → 503).
    checks.redis = {
      ok: true,
      note: 'not configured — will be verified when Redis is added',
    };

    // Derive overall status.
    // Only `critical` dependencies affect the HTTP status code.
    // Currently: database is the only critical dependency.
    const criticalOk = checks.database.ok;

    const status = criticalOk ? 'ready' : 'degraded';
    const httpStatus = criticalOk ? 200 : 503;

    return reply.status(httpStatus).send({
      status,
      dependencies: checks,
      timestamp: new Date().toISOString(),
    });
  });

  // ── GET /metrics — internal metrics snapshot ─────────────────────────────────
  //
  // Authentication strategy:
  //
  //   1. METRICS_ENABLED=false  → always 404 (kill switch, checked first)
  //   2. METRICS_SECRET is set  → require `x-metrics-key` header to match
  //   3. METRICS_SECRET not set + production → 403 (safe default: deny)
  //   4. METRICS_SECRET not set + development → allow (dev convenience)
  //
  // To enable in production, set METRICS_SECRET to a long random string and
  // pass it as `x-metrics-key` from your monitoring infrastructure.
  app.get('/metrics', async (request, reply) => {
    // ── Kill switch ────────────────────────────────────────────────────────────
    if (process.env.METRICS_ENABLED === 'false') {
      return reply.status(404).send({ error: 'Not found' });
    }

    const metricsSecret = process.env.METRICS_SECRET;
    const isProduction  = process.env.NODE_ENV === 'production';

    if (metricsSecret) {
      // Secret is configured — enforce header check in all environments.
      const provided = request.headers['x-metrics-key'];
      if (provided !== metricsSecret) {
        return reply.status(403).send({ error: 'Forbidden' });
      }
    } else if (isProduction) {
      // No secret set in production — deny by default.
      // Fix: set METRICS_SECRET env var and pass it as x-metrics-key.
      request.log.warn(
        { url: request.url },
        'GET /metrics blocked: METRICS_SECRET is not set in production. ' +
        'Set METRICS_SECRET environment variable to enable this endpoint.',
      );
      return reply.status(403).send({
        error:  'Forbidden',
        detail: 'Metrics endpoint requires METRICS_SECRET to be configured in production.',
      });
    }
    // Else: development without a secret — allow for convenience.

    const snapshot = await metrics.snapshot();
    return reply.send(snapshot);
  });
}
