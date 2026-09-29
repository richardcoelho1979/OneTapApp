import type { FastifyInstance } from '../../shared/types/fastify';
import { requireAuth } from '../../shared/middleware/requireAuth';
import { championshipsService } from './championships.service';

export async function championshipsRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAuth);

  app.get<{ Querystring: { status?: string } }>('/championships', async (request, reply) => {
    return reply.send(await championshipsService.getAll(request.query.status));
  });

  app.get<{ Params: { championshipId: string } }>(
    '/championships/:championshipId',
    async (request, reply) => {
      return reply.send(await championshipsService.getById(request.params.championshipId));
    },
  );
}
