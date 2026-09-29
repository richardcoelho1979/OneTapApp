import type { FastifyInstance } from '../../shared/types/fastify';
import { SendFriendRequestBody, RespondToFriendRequestBody } from '@workspace/api-zod';
import { requireAuth } from '../../shared/middleware/requireAuth';
import { friendsService } from './friends.service';

export async function friendsRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAuth);

  // GET /api/v1/friends
  app.get('/friends', async (request, reply) => {
    return reply.send(await friendsService.getFriends(request.userId!));
  });

  // POST /api/v1/friends/request
  app.post('/friends/request', async (request, reply) => {
    const parsed = SendFriendRequestBody.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.message });
    const result = await friendsService.sendFriendRequest(request.userId!, parsed.data.toUserId);
    return reply.status(201).send(result);
  });

  // GET /api/v1/friends/requests
  app.get('/friends/requests', async (request, reply) => {
    return reply.send(await friendsService.getIncomingRequests(request.userId!));
  });

  // GET /api/v1/friends/requests/sent
  app.get('/friends/requests/sent', async (request, reply) => {
    return reply.send(await friendsService.getSentRequests(request.userId!));
  });

  // PATCH /api/v1/friends/requests/:requestId
  app.patch<{ Params: { requestId: string } }>(
    '/friends/requests/:requestId',
    async (request, reply) => {
      const parsed = RespondToFriendRequestBody.safeParse(request.body);
      if (!parsed.success) return reply.status(400).send({ error: parsed.error.message });
      const result = await friendsService.respondToRequest(
        request.params.requestId,
        request.userId!,
        parsed.data.action,
      );
      return reply.send(result);
    },
  );

  // DELETE /api/v1/friends/:friendId
  app.delete<{ Params: { friendId: string } }>('/friends/:friendId', async (request, reply) => {
    await friendsService.removeFriend(request.userId!, request.params.friendId);
    return reply.status(204).send();
  });
}
