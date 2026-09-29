import type { FastifyInstance } from '../../shared/types/fastify';
import { requireAuth } from '../../shared/middleware/requireAuth';
import { gamesService } from './games.service';

export async function gamesRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAuth);
  app.get('/games', async (_req, reply) => reply.send(await gamesService.getActive()));
}
