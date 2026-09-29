import type { FastifyInstance } from '../../shared/types/fastify';
import { requireAuth } from '../../shared/middleware/requireAuth';
import { subscriptionsService } from './subscriptions.service';

export async function subscriptionsRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAuth);
  app.get('/subscriptions/me', async (request, reply) => {
    return reply.send(await subscriptionsService.getMyStatus(request.userId!));
  });
}
