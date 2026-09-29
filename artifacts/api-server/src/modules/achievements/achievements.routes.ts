import type { FastifyInstance } from '../../shared/types/fastify';
import { requireAuth } from '../../shared/middleware/requireAuth';
import { achievementsService } from './achievements.service';

export async function achievementsRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAuth);
  app.get('/achievements', async (_req, reply) => reply.send(await achievementsService.getAll()));
}
