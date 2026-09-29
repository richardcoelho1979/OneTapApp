import type { FastifyInstance } from '../../shared/types/fastify';
import { requireAuth } from '../../shared/middleware/requireAuth';
import { rankingsService } from './rankings.service';

export async function rankingsRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAuth);

  app.get<{ Querystring: { limit?: string } }>('/rankings', async (request, reply) => {
    const limit = Math.min(Number(request.query.limit) || 50, 100);
    return reply.send(await rankingsService.getGlobal(limit));
  });

  app.get('/rankings/friends', async (request, reply) => {
    return reply.send(await rankingsService.getFriends(request.userId!));
  });
}
