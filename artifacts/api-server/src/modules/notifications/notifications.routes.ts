import type { FastifyInstance } from '../../shared/types/fastify';
import { requireAuth } from '../../shared/middleware/requireAuth';
import { notificationsService } from './notifications.service';

export async function notificationsRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAuth);

  // GET /api/v1/notifications?unreadOnly=true
  app.get<{ Querystring: { unreadOnly?: string } }>('/notifications', async (request, reply) => {
    const unreadOnly = request.query.unreadOnly === 'true';
    const results = await notificationsService.getForUser(request.userId!, unreadOnly);
    return reply.send(results);
  });

  // PATCH /api/v1/notifications/:notificationId/read
  app.patch<{ Params: { notificationId: string } }>(
    '/notifications/:notificationId/read',
    async (request, reply) => {
      const result = await notificationsService.markRead(
        request.params.notificationId,
        request.userId!,
      );
      return reply.send(result);
    },
  );

  // POST /api/v1/notifications/read-all
  app.post('/notifications/read-all', async (request, reply) => {
    await notificationsService.markAllRead(request.userId!);
    return reply.status(204).send();
  });
}
