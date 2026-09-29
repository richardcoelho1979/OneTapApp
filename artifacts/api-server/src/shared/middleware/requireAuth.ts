import type { FastifyRequest, FastifyReply } from '../types/fastify';
import { verifyAccessToken } from '../../lib/auth';
import { AppError } from '../errors/AppError';

/**
 * Fastify preHandler — verifies the Bearer JWT and attaches userId to the request.
 *
 * Usage on a route:
 *   app.get('/protected', { preHandler: [requireAuth] }, handler)
 *
 * Usage on a group of routes (register with preHandler at plugin level):
 *   app.addHook('preHandler', requireAuth)
 */
export async function requireAuth(
  request: FastifyRequest,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _reply: FastifyReply,
): Promise<void> {
  const auth = request.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    // Throw instead of reply.send() so the global error handler runs:
    // it adds correlationId to the body and logs at warn level.
    throw AppError.unauthorized();
  }

  const payload = verifyAccessToken(auth.slice(7));
  if (!payload) {
    throw AppError.unauthorized('Invalid or expired token');
  }

  request.userId = payload.userId;

  // Enrich the per-request child logger with userId so every subsequent
  // request.log.* call automatically carries it — no need to pass it manually
  // through the call stack in routes or services.
  request.log = request.log.child({ userId: payload.userId });
}
