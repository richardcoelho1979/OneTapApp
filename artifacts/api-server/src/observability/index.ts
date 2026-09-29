/**
 * observability/index.ts
 *
 * Registers all observability hooks on the Fastify instance.
 *
 * What this module owns:
 *   1. Correlation ID  — generated per request, propagated to all logs and
 *                        returned in the X-Correlation-Id response header.
 *   2. Structured logs — Fastify's built-in request logging is replaced with
 *                        richer, domain-aware logs (userId, sessionId, roomId).
 *   3. Metrics         — records response time and status code for every request.
 *
 * What this module does NOT own:
 *   - Health / readiness checks  → modules/health/health.routes.ts
 *   - Error handling             → app.ts (setErrorHandler)
 *   - Authentication             → shared/middleware/requireAuth.ts
 *
 * Configuration:
 *   OBSERVABILITY_ENABLED=false  — disable all hooks (useful in test runners).
 *                                  Defaults to enabled.
 */

import { randomUUID } from 'node:crypto';
import type { FastifyInstance } from '../shared/types/fastify';
import { metrics } from './metrics';

export { metrics };
export type { MetricsSnapshot } from './metrics';

// ─────────────────────────────────────────────────────────────────────────────

export async function registerObservability(app: FastifyInstance): Promise<void> {
  if (process.env.OBSERVABILITY_ENABLED === 'false') {
    app.log.info('Observability disabled via OBSERVABILITY_ENABLED=false');
    return;
  }

  // ── 1. Correlation ID ──────────────────────────────────────────────────────
  //
  // Every request gets a Correlation ID that travels through all log lines
  // for that request. If the client supplies X-Correlation-Id (e.g. from a
  // previous retry or from a mobile app session), we honour it.
  //
  // The ID is stored on `request.correlationId` and the per-request logger
  // is replaced with a child logger that carries it automatically — so every
  // `request.log.info(...)` call anywhere in the lifecycle will include it.
  app.addHook('onRequest', async (request) => {
    const correlationId =
      (request.headers['x-correlation-id'] as string | undefined)?.trim() ||
      randomUUID();

    request.correlationId = correlationId;

    // Child logger: all subsequent `request.log.*` calls carry correlationId.
    request.log = request.log.child({ correlationId });

    // Structured "incoming request" log.
    // (Fastify's built-in equivalent is disabled via disableRequestLogging: true
    //  in app.ts so we don't get duplicate lines.)
    request.log.info(
      {
        method:        request.method,
        url:           request.url,
        remoteAddress: request.ip,
      },
      'incoming request',
    );
  });

  // ── 2. Propagate Correlation ID in the response ────────────────────────────
  //
  // Clients and API gateways can use this to correlate their request logs with
  // server logs without needing distributed tracing infrastructure.
  app.addHook('onSend', async (request, reply) => {
    void reply.header('x-correlation-id', request.correlationId ?? '');
  });

  // ── 3. Enriched completion log + metrics recording ─────────────────────────
  //
  // Emits a single structured log line per request with all the context needed
  // to answer "what happened, when, for whom, in which room/session, how fast".
  //
  // Fields populated here:
  //   - method, url, statusCode, responseTime — always present
  //   - userId     — set by requireAuth on authenticated routes
  //   - sessionId  — set from URL params (e.g. /sessions/:sessionId/action)
  //   - roomId     — set from URL params (e.g. /rooms/:roomId/session/start)
  //
  // The child logger already carries correlationId from step 1.
  app.addHook('onResponse', async (request, reply) => {
    const params = request.params as Record<string, string>;

    const ctx: Record<string, unknown> = {
      method:       request.method,
      url:          request.url,
      statusCode:   reply.statusCode,
      responseTime: Math.round(reply.elapsedTime * 100) / 100, // ms, 2 decimal places
    };

    if (request.userId)    ctx.userId    = request.userId;
    if (params.sessionId)  ctx.sessionId = params.sessionId;
    if (params.roomId)     ctx.roomId    = params.roomId;

    // Choose log level based on outcome:
    //   5xx → error (will trigger alerts in log aggregators)
    //   4xx → warn  (client errors — filterable separately from noise)
    //   2xx/3xx → info
    const statusCode = reply.statusCode;
    if (statusCode >= 500) {
      request.log.error(ctx, 'request completed');
    } else if (statusCode >= 400) {
      request.log.warn(ctx, 'request completed');
    } else {
      request.log.info(ctx, 'request completed');
    }

    // Record in the in-memory metrics store.
    metrics.recordRequest(reply.elapsedTime, reply.statusCode);
  });

  app.log.info('Observability hooks registered (correlationId, structured logs, metrics)');
}
