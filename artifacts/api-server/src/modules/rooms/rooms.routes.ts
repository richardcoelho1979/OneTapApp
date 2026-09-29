import type { FastifyInstance } from '../../shared/types/fastify';
import { CreateRoomBody, JoinRoomByCodeBody } from '@workspace/api-zod';
import { requireAuth } from '../../shared/middleware/requireAuth';
import { roomsService } from './rooms.service';

export async function roomsRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAuth);

  // GET /api/v1/rooms
  app.get('/rooms', async (request, reply) => {
    return reply.send(await roomsService.getActiveRooms());
  });

  // POST /api/v1/rooms
  app.post('/rooms', async (request, reply) => {
    const parsed = CreateRoomBody.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.message });
    const { name, maxPlayers, isPrivate, gameId } = parsed.data;
    const room = await roomsService.createRoom(request.userId!, { name, maxPlayers, isPrivate, gameId: gameId ?? undefined });
    return reply.status(201).send(room);
  });

  // GET /api/v1/rooms/:roomId
  app.get<{ Params: { roomId: string } }>('/rooms/:roomId', async (request, reply) => {
    return reply.send(await roomsService.getRoom(request.params.roomId));
  });

  // DELETE /api/v1/rooms/:roomId
  app.delete<{ Params: { roomId: string } }>('/rooms/:roomId', async (request, reply) => {
    await roomsService.deleteRoom(request.params.roomId, request.userId!);
    return reply.status(204).send();
  });

  // POST /api/v1/rooms/:roomId/join
  app.post<{ Params: { roomId: string } }>('/rooms/:roomId/join', async (request, reply) => {
    return reply.send(await roomsService.joinRoom(request.params.roomId, request.userId!));
  });

  // POST /api/v1/rooms/:roomId/leave
  app.post<{ Params: { roomId: string } }>('/rooms/:roomId/leave', async (request, reply) => {
    await roomsService.leaveRoom(request.params.roomId, request.userId!);
    return reply.status(204).send();
  });

  // POST /api/v1/rooms/join-by-code
  app.post('/rooms/join-by-code', async (request, reply) => {
    const parsed = JoinRoomByCodeBody.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.message });
    return reply.send(await roomsService.joinByCode(parsed.data.code, request.userId!));
  });
}
