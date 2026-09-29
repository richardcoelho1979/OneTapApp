import type { FastifyInstance } from '../../shared/types/fastify';
import { UpdateMeBody } from '@workspace/api-zod';
import { requireAuth } from '../../shared/middleware/requireAuth';
import { usersService } from './users.service';

export async function usersRoutes(app: FastifyInstance): Promise<void> {
  // All user routes require authentication
  app.addHook('preHandler', requireAuth);

  // GET /api/v1/users/me
  app.get('/users/me', async (request, reply) => {
    const profile = await usersService.getMe(request.userId!);
    return reply.send(profile);
  });

  // PATCH /api/v1/users/me
  app.patch('/users/me', async (request, reply) => {
    const parsed = UpdateMeBody.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.message });

    const profile = await usersService.updateMe(request.userId!, parsed.data);
    return reply.send(profile);
  });

  // GET /api/v1/users/search?q=
  app.get<{ Querystring: { q?: string } }>('/users/search', async (request, reply) => {
    const q = typeof request.query.q === 'string' ? request.query.q.trim() : '';
    const results = await usersService.searchUsers(q);
    return reply.send(results);
  });

  // GET /api/v1/users/:userId
  app.get<{ Params: { userId: string } }>('/users/:userId', async (request, reply) => {
    const profile = await usersService.getUserById(request.params.userId);
    return reply.send(profile);
  });

  // GET /api/v1/users/:userId/achievements
  app.get<{ Params: { userId: string } }>('/users/:userId/achievements', async (request, reply) => {
    const results = await usersService.getUserAchievements(request.params.userId);
    return reply.send(results);
  });
}
