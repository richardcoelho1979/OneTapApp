import type { FastifyInstance } from '../../shared/types/fastify';
import { requireAuth } from '../../shared/middleware/requireAuth';
import { seasonsService } from './seasons.service';

export async function seasonsRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAuth);
  app.get('/seasons', async (_req, reply) => reply.send(await seasonsService.getAll()));
  app.get('/seasons/current', async (_req, reply) => reply.send(await seasonsService.getCurrent()));
}
