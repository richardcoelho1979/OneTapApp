import type { FastifyInstance } from '../../shared/types/fastify';
import {
  StartSessionBody,
  StartSoloSessionBody,
  UpdateSessionStateBody,
  FinishSessionBody,
  UpdatePlayerConnectionBody,
  SubmitGameActionBody,
} from '@workspace/api-zod';
import { requireAuth } from '../../shared/middleware/requireAuth';
import { sessionsService } from './sessions.service';

export async function sessionsRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAuth);

  // POST /api/v1/rooms/:roomId/session/start
  app.post<{ Params: { roomId: string } }>(
    '/rooms/:roomId/session/start',
    async (request, reply) => {
      const parsed = StartSessionBody.safeParse(request.body);
      if (!parsed.success) return reply.status(400).send({ error: parsed.error.message });
      const session = await sessionsService.startSession(
        request.params.roomId,
        parsed.data.gameId,
        request.userId!,
      );
      return reply.status(201).send(session);
    },
  );

  // POST /api/v1/sessions/solo — start a solo session (private 1-player room)
  app.post('/sessions/solo', async (request, reply) => {
    const parsed = StartSoloSessionBody.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.message });
    const session = await sessionsService.startSoloSession(parsed.data.gameId, request.userId!);
    return reply.status(201).send(session);
  });

  // GET /api/v1/rooms/:roomId/session/current — active session of a room
  app.get<{ Params: { roomId: string } }>(
    '/rooms/:roomId/session/current',
    async (request, reply) => {
      return reply.send(
        await sessionsService.getRoomCurrentSession(request.params.roomId, request.userId!),
      );
    },
  );

  // POST /api/v1/sessions/:sessionId/action — 60 ações por minuto por IP (anti-flood de jogadas)
  app.post<{ Params: { sessionId: string } }>(
    '/sessions/:sessionId/action',
    { config: { rateLimit: { max: 60, timeWindow: 60_000 } } },
    async (request, reply) => {
      const parsed = SubmitGameActionBody.safeParse(request.body);
      if (!parsed.success) return reply.status(400).send({ error: parsed.error.message });
      return reply.send(
        await sessionsService.submitAction(request.params.sessionId, request.userId!, {
          type: parsed.data.type,
          payload: (parsed.data.payload ?? {}) as Record<string, unknown>,
        }),
      );
    },
  );

  // GET /api/v1/sessions/:sessionId
  app.get<{ Params: { sessionId: string } }>(
    '/sessions/:sessionId',
    async (request, reply) => {
      return reply.send(await sessionsService.getSession(request.params.sessionId, request.userId!));
    },
  );

  // POST /api/v1/sessions/:sessionId/pause
  app.post<{ Params: { sessionId: string } }>(
    '/sessions/:sessionId/pause',
    async (request, reply) => {
      return reply.send(await sessionsService.pauseSession(request.params.sessionId, request.userId!));
    },
  );

  // POST /api/v1/sessions/:sessionId/resume
  app.post<{ Params: { sessionId: string } }>(
    '/sessions/:sessionId/resume',
    async (request, reply) => {
      return reply.send(await sessionsService.resumeSession(request.params.sessionId, request.userId!));
    },
  );

  // POST /api/v1/sessions/:sessionId/state
  app.post<{ Params: { sessionId: string } }>(
    '/sessions/:sessionId/state',
    async (request, reply) => {
      const parsed = UpdateSessionStateBody.safeParse(request.body);
      if (!parsed.success) return reply.status(400).send({ error: parsed.error.message });
      const { state, round, currentTurnUserId } = parsed.data;
      return reply.send(
        await sessionsService.updateState(request.params.sessionId, request.userId!, state, round, currentTurnUserId ?? undefined),
      );
    },
  );

  // POST /api/v1/sessions/:sessionId/finish
  app.post<{ Params: { sessionId: string } }>(
    '/sessions/:sessionId/finish',
    async (request, reply) => {
      const parsed = FinishSessionBody.safeParse(request.body);
      if (!parsed.success) return reply.status(400).send({ error: parsed.error.message });
      return reply.send(
        await sessionsService.finishSession(request.params.sessionId, request.userId!, parsed.data.results),
      );
    },
  );

  // PATCH /api/v1/sessions/:sessionId/players/:userId/connection
  app.patch<{ Params: { sessionId: string; userId: string } }>(
    '/sessions/:sessionId/players/:userId/connection',
    async (request, reply) => {
      const parsed = UpdatePlayerConnectionBody.safeParse(request.body);
      if (!parsed.success) return reply.status(400).send({ error: parsed.error.message });
      return reply.send(
        await sessionsService.updatePlayerConnection(
          request.params.sessionId,
          request.userId!,
          request.params.userId,
          parsed.data.isConnected,
        ),
      );
    },
  );
}
