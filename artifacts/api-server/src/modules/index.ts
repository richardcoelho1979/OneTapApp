import type { FastifyInstance } from '../shared/types/fastify';
import { healthRoutes } from './health/health.routes';
import { authRoutes } from './auth/auth.routes';
import { usersRoutes } from './users/users.routes';
import { friendsRoutes } from './friends/friends.routes';
import { roomsRoutes } from './rooms/rooms.routes';
import { notificationsRoutes } from './notifications/notifications.routes';
import { seasonsRoutes } from './seasons/seasons.routes';
import { achievementsRoutes } from './achievements/achievements.routes';
import { rankingsRoutes } from './rankings/rankings.routes';
import { championshipsRoutes } from './championships/championships.routes';
import { subscriptionsRoutes } from './subscriptions/subscriptions.routes';
import { gamesRoutes } from './games/games.routes';
import { sessionsRoutes } from './sessions/sessions.routes';

// ─────────────────────────────────────────────────────────────────────────────
// Route registry
//
// All API routes live under the /api/v1 prefix (versioning from day one).
// Health check has no prefix — it must be reachable before authentication.
//
// To extract a module into its own microservice in the future:
//   1. Move the module directory to a new repo / service.
//   2. Replace the import here with an HTTP proxy plugin that forwards
//      /api/v1/<module>/* to the microservice URL.
//   3. No other file in the monolith needs to change.
// ─────────────────────────────────────────────────────────────────────────────

export async function registerRoutes(app: FastifyInstance): Promise<void> {
  // Infrastructure — registered without prefix so orchestrators, load balancers,
  // and uptime monitors can reach /health, /ready, /metrics, and /healthz directly.
  // Also registered under /api/v1 so the generated API client can reach /healthz
  // (kept for backward compatibility — new code should use /health and /ready).
  await app.register(healthRoutes);
  await app.register(healthRoutes, { prefix: '/api/v1' });

  // Domain modules — all under /api/v1
  const V1 = '/api/v1';
  await app.register(authRoutes,          { prefix: V1 });
  await app.register(usersRoutes,         { prefix: V1 });
  await app.register(friendsRoutes,       { prefix: V1 });
  await app.register(roomsRoutes,         { prefix: V1 });
  await app.register(notificationsRoutes, { prefix: V1 });
  await app.register(seasonsRoutes,       { prefix: V1 });
  await app.register(achievementsRoutes,  { prefix: V1 });
  await app.register(rankingsRoutes,      { prefix: V1 });
  await app.register(championshipsRoutes, { prefix: V1 });
  await app.register(subscriptionsRoutes, { prefix: V1 });
  await app.register(gamesRoutes,         { prefix: V1 });
  await app.register(sessionsRoutes,      { prefix: V1 });
}
