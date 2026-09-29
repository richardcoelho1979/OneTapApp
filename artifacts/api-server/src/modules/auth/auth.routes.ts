/**
 * Auth Routes — thin HTTP layer.
 * Validates request bodies, calls authService, sends responses.
 * No business logic here.
 */
import type { FastifyInstance } from '../../shared/types/fastify';
import {
  RegisterBody,
  LoginBody,
  RefreshTokenBody,
  LoginWithGoogleBody,
  LoginWithAppleBody,
} from '@workspace/api-zod';
import { requireAuth } from '../../shared/middleware/requireAuth';
import { authService } from './auth.service';

export async function authRoutes(app: FastifyInstance): Promise<void> {
  // POST /api/v1/auth/register  — 5 tentativas por minuto por IP
  app.post('/auth/register', { config: { rateLimit: { max: 5, timeWindow: 60_000 } } }, async (request, reply) => {
    const parsed = RegisterBody.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.message });

    const result = await authService.register(parsed.data);
    return reply.status(201).send(result);
  });

  // POST /api/v1/auth/login  — 10 tentativas por minuto por IP (brute-force)
  app.post('/auth/login', { config: { rateLimit: { max: 10, timeWindow: 60_000 } } }, async (request, reply) => {
    const parsed = LoginBody.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.message });

    const result = await authService.login(parsed.data.email, parsed.data.password);
    return reply.send(result);
  });

  // POST /api/v1/auth/refresh
  app.post('/auth/refresh', async (request, reply) => {
    const parsed = RefreshTokenBody.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.message });

    const result = await authService.refresh(parsed.data.refreshToken);
    return reply.send(result);
  });

  // POST /api/v1/auth/logout  (protected)
  app.post('/auth/logout', { preHandler: [requireAuth] }, async (request, reply) => {
    await authService.logout(request.userId!);
    return reply.status(204).send();
  });

  // POST /api/v1/auth/google  — 10 tentativas por minuto por IP
  app.post('/auth/google', { config: { rateLimit: { max: 10, timeWindow: 60_000 } } }, async (request, reply) => {
    const parsed = LoginWithGoogleBody.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.message });

    const result = await authService.loginWithGoogle(parsed.data.token);
    return reply.send(result);
  });

  // POST /api/v1/auth/apple  — 10 tentativas por minuto por IP
  app.post('/auth/apple', { config: { rateLimit: { max: 10, timeWindow: 60_000 } } }, async (request, reply) => {
    const parsed = LoginWithAppleBody.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.message });

    const result = await authService.loginWithApple(parsed.data.token);
    return reply.send(result);
  });
}
