import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import compress from '@fastify/compress';
import rateLimit from '@fastify/rate-limit';
import { runMigrations } from '@workspace/db';
import { registerRoutes } from './modules/index';
import { seedGames } from './games/registry';
import { registerObservability, metrics } from './observability';
import type { FastifyInstance } from './shared/types/fastify';
import type { AppError } from './shared/errors/AppError';

/**
 * Builds and configures the Fastify application.
 * Separated from the entry point so the app can be tested without binding to a port.
 */
export async function buildApp(): Promise<FastifyInstance> {
  const isProduction = process.env.NODE_ENV === 'production';

  const app = Fastify({
    // Fastify ships Pino natively — no pino-http wrapper needed.
    logger: {
      level: process.env.LOG_LEVEL ?? 'info',
      // Redact sensitive values from the serialized `req` object that Pino logs.
      // The actual header values never appear in log output.
      redact: ['req.headers.authorization', 'req.headers.cookie'],
      ...(isProduction
        ? {}
        : {
            transport: {
              target: 'pino-pretty',
              options: { colorize: true },
            },
          }),
    },

    // Disable Fastify's built-in "incoming request" / "request completed" logs.
    // The observability module replaces them with richer, domain-aware equivalents
    // that include correlationId, userId, sessionId, and roomId.
    disableRequestLogging: true,
  });

  // ── Migrations ───────────────────────────────────────────────────────────────
  // Runs pending SQL migrations on every boot (idempotent — already-applied
  // migrations are skipped). Create new migrations with:
  //   pnpm --filter @workspace/db run generate
  await runMigrations();
  app.log.info('Database migrations up to date');

  // ── JSON body parser — tolerates empty bodies ────────────────────────────────
  // Fastify's default JSON parser rejects `Content-Type: application/json` with
  // an empty body (FST_ERR_CTP_EMPTY_JSON_BODY). Mobile SDKs often send the
  // header even for POST requests that have no body (e.g. logout, heartbeat).
  // This replacement parser treats an empty body as `{}` instead of an error.
  app.addContentTypeParser(
    'application/json',
    { parseAs: 'string' },
    (_req, body, done) => {
      const str = (body as string).trim();
      if (!str) {
        done(null, {});
        return;
      }
      try {
        done(null, JSON.parse(str));
      } catch (err) {
        (err as Error & { statusCode?: number }).statusCode = 400;
        done(err as Error, undefined);
      }
    },
  );

  // ── Observability ─────────────────────────────────────────────────────────────
  // Must be registered BEFORE other plugins and routes so the onRequest hook
  // runs first (correlationId generation) and onResponse hook runs last
  // (metrics recording after response is sent).
  //
  // Registers:
  //   - Correlation ID generation and propagation
  //   - Structured per-request logs (replaces disableRequestLogging)
  //   - In-memory metrics recording
  //
  // Disable with: OBSERVABILITY_ENABLED=false (useful in test runners)
  await registerObservability(app);

  // ── CORS ─────────────────────────────────────────────────────────────────────
  // CORS_ORIGINS: comma-separated list of allowed origins.
  // Example: "https://app.example.com,https://staging.example.com"
  //
  // In development, falls back to '*' if the var is not set.
  // In production, '*' is NEVER used — omitting the var blocks all browser origins.
  const rawOrigins = process.env.CORS_ORIGINS;

  let corsOrigin: string | string[] | RegExp | boolean;
  if (rawOrigins) {
    corsOrigin = rawOrigins.split(',').map((o) => o.trim()).filter(Boolean);
    app.log.info({ origins: corsOrigin }, 'CORS allowlist active');
  } else if (!isProduction) {
    corsOrigin = '*';
    app.log.warn('CORS_ORIGINS not set — allowing all origins (dev mode)');
  } else {
    // Production with no allowlist: deny all cross-origin browser requests.
    corsOrigin = false;
    app.log.warn('CORS_ORIGINS not set in production — all browser origins denied');
  }

  await app.register(cors, {
    origin: corsOrigin,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // Global rate limit — applies to every route unless overridden.
  // Auth endpoints and game actions get tighter limits via config below.
  await app.register(rateLimit, {
    global: true,
    max: 120,           // 120 req / minute per IP (2 req/s — enough for normal use)
    timeWindow: 60_000, // 1 minute
    keyGenerator: (req) => req.headers['x-forwarded-for']?.toString().split(',')[0].trim() ?? req.ip,
    // @fastify/rate-limit v9 does `throw errorResponseBuilder(req, ctx)`.
    // The thrown value is caught by setErrorHandler, which reads `.statusCode`
    // and `.message`. Without statusCode here, the handler defaults to 500.
    errorResponseBuilder: (_req, context) => ({
      statusCode: 429,
      message: `Too many requests. Try again in ${Math.ceil(context.ttl / 1000)} seconds.`,
    }),
  });

  // ── Security headers ─────────────────────────────────────────────────────────
  // helmet sets safe defaults: X-Content-Type-Options, X-Frame-Options,
  // Referrer-Policy, Strict-Transport-Security (HSTS), etc.
  // contentSecurityPolicy is disabled here — the API serves JSON, not HTML.
  await app.register(helmet, { contentSecurityPolicy: false });

  // ── Response compression ──────────────────────────────────────────────────────
  // Compresses JSON responses with Brotli (preferred) or Gzip.
  // Saves bandwidth for list endpoints (rankings, rooms, notifications, etc.)
  // on mobile networks. Threshold: 1 KB — smaller payloads aren't worth compressing.
  await app.register(compress, { threshold: 1024 });

  // ── Game plugins ─────────────────────────────────────────────────────────────
  // Discover installed game modules and seed their metadata + achievements.
  await seedGames((msg) => app.log.info(msg));

  // ── Global error handler ─────────────────────────────────────────────────────
  //
  // Responsibilities:
  //   1. Translate any error into a structured, consistent JSON response.
  //   2. Log 5xx errors with full stack trace (never sent to client).
  //   3. Log 4xx errors at warn level (filterable; not noise, not silence).
  //   4. Include correlationId in the response body so clients can report it.
  //   5. Never expose stack traces, internal paths, or raw DB error messages.
  //
  // Error response shape:
  //   { statusCode, error, code?, correlationId? }
  //
  // AppError instances carry `.statusCode` and `.code` — all other errors become 500.
  // IMPORTANT: this handler MUST NOT be async.
  //
  // If it were async, it would return a Promise. Fastify's wrapThenable() would
  // then await the Promise and call reply.send(undefined) afterwards — which
  // triggers the kReplyIsError path and sends the error serializer output,
  // overwriting our reply.raw.end() response. A sync handler returns undefined,
  // so Fastify skips the extra reply.send() call.
  app.setErrorHandler(
    (error: Error & { statusCode?: number; code?: string }, request, reply) => {
      // ── Hijack the reply FIRST ─────────────────────────────────────────────
      // reply.hijack() marks the reply as "sent" (reply.sent === true).
      // Any subsequent reply.send() call — from wrapThenable, compress, or any
      // other Fastify-internal path — checks reply.sent first and returns a
      // no-op warning. This gives us full ownership of the raw socket.
      // The onResponse hook still fires via the Node.js 'finish' event (reply.js:867).
      reply.hijack();

      const statusCode =
        typeof error.statusCode === 'number' ? error.statusCode : 500;

      // ── Logging ────────────────────────────────────────────────────────────
      if (statusCode >= 500) {
        // Full error object including stack trace — stays in logs, never in response.
        request.log.error(
          {
            err: {
              message: error.message,
              name:    error.name,
              stack:   error.stack,
              code:    (error as AppError).code,
            },
          },
          'Unhandled server error',
        );
        // Increment the error counter in the metrics store.
        // recordRequest() in the onResponse hook also tracks 5xx via status code,
        // but errors thrown before onResponse fires (e.g. during serialization)
        // would be missed — so we record here as a safety net.
        metrics.recordError();
      } else if (statusCode === 429) {
        // Rate limit — don't spam warn logs; debug is enough.
        request.log.debug({ statusCode }, 'Rate limit exceeded');
      } else if (statusCode >= 400) {
        request.log.warn(
          {
            statusCode,
            code:    (error as AppError).code,
            message: error.message,
          },
          'Client error',
        );
      }

      // ── Response body ──────────────────────────────────────────────────────
      // 5xx: generic message — never leak internal details.
      // 4xx: the error.message is safe (it's our own AppError message).
      const errorMessage =
        statusCode >= 500
          ? 'Internal server error'
          : error.message || 'An error occurred';

      const body: Record<string, unknown> = {
        statusCode,
        error: errorMessage,
      };

      // Include machine-readable code when available (e.g. 'NOT_FOUND', 'CONFLICT').
      const code = (error as AppError).code;
      if (code) body.code = code;

      // Correlation ID lets clients report exactly which request failed.
      if (request.correlationId) body.correlationId = request.correlationId;

      // ── Why we write to reply.raw instead of calling reply.send() ─────────────
      //
      // Fastify v4 sets `kReplyIsError = true` on the reply object before calling
      // setErrorHandler. When kReplyIsError is true, any `reply.send(payload)`
      // call (even with a plain object or string) routes through:
      //   onErrorHook → handleError → fallbackErrorHandler → error serializer
      //
      // The error serializer is a pre-compiled function that only outputs
      // {statusCode, code, error, message} — any extra field (correlationId)
      // is silently dropped, and `message` is injected from the original error.
      //
      // Writing directly to reply.raw bypasses this pipeline. The onResponse
      // hook (metrics) still fires because Fastify listens to the Node.js
      // `finish` event on reply.raw (reply.js:867), not to reply.send().
      const json = JSON.stringify(body);

      // Collect all headers already set (helmet, cors, rate-limit, etc.).
      // error-handler.js deletes content-type and content-length before calling
      // setErrorHandler, so those are safe to (re-)set here.
      // Filter out undefined values from getHeaders() — Node's writeHead rejects them.
      const existingHeaders = Object.fromEntries(
        Object.entries(reply.getHeaders()).filter(([, v]) => v !== undefined),
      ) as Record<string, string | number | string[]>;
      const responseHeaders: Record<string, string | number | string[]> = {
        ...existingHeaders,
        'content-type': 'application/json; charset=utf-8',
        'content-length': Buffer.byteLength(json),
      };
      if (request.correlationId) {
        responseHeaders['x-correlation-id'] = request.correlationId;
      }

      try {
        reply.raw.writeHead(statusCode, responseHeaders);
      } catch {
        // writeHead can fail if the response was already started.
        // Proceed to end() anyway — the body is still written.
      }
      reply.raw.end(json, 'utf8');
    },
  );

  app.setNotFoundHandler((request, reply) => {
    reply.status(404).send({
      statusCode: 404,
      error: 'Route not found',
      ...(request.correlationId && { correlationId: request.correlationId }),
    });
  });

  // ── Routes ───────────────────────────────────────────────────────────────
  // IMPORTANT: routes are registered AFTER setErrorHandler and setNotFoundHandler.
  // In Fastify, plugins registered via app.register() inherit the error handler
  // that is set on the parent scope at the time the plugin executes. Since avvio
  // executes plugins when awaited, the error handler must be configured before
  // route registration to guarantee all scoped plugins see the correct handler.
  await registerRoutes(app);

  return app;
}
