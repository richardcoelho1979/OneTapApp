/**
 * Sessions Service
 *
 * Cross-module calls (allowed in the monolith; becomes HTTP/event when extracted):
 *   → roomsRepository  (only to read room info — via rooms service in future)
 *   → gamesRepository  (only to validate game exists)
 *   → usersService.addXP  (cross-module service call)
 *   → roomsRepository.setStatus (updates room status after session starts/ends)
 */
import { eq } from 'drizzle-orm';
import {
  db,
  roomsTable,
  roomPlayersTable,
  gamesTable,
  gameSessionsTable,
  gameSessionPlayersTable,
} from '@workspace/db';
import { generateId } from '../../lib/auth';
import { AppError } from '../../shared/errors/AppError';
import { usersService } from '../users/users.service';
import { roomsRepository } from '../rooms/rooms.repository';
import { sessionsRepository } from './sessions.repository';
import { gameRunner } from '../../games/runner';

// ─── XP reward table ─────────────────────────────────────────────────────────
const XP_BY_RANK: Record<number, number> = { 1: 100, 2: 60, 3: 40 };
const DEFAULT_XP = 20;
// Solo sessions grant a fixed, lower XP and never count as wins —
// otherwise grinding solo games would trivially inflate ranking/win stats.
const SOLO_XP = 25;

// ─── Response builder ─────────────────────────────────────────────────────────
async function buildSession(sessionId: string) {
  const session = await sessionsRepository.findById(sessionId);
  if (!session) return null;
  const players = await sessionsRepository.getPlayers(sessionId);

  return {
    id: session.id,
    roomId: session.roomId,
    gameId: session.gameId,
    status: session.status,
    round: session.round,
    currentTurnUserId: session.currentTurnUserId ?? null,
    state: session.state ?? {},
    startedAt: session.startedAt?.toISOString() ?? null,
    pausedAt: session.pausedAt?.toISOString() ?? null,
    resumedAt: session.resumedAt?.toISOString() ?? null,
    finishedAt: session.finishedAt?.toISOString() ?? null,
    createdAt: session.createdAt.toISOString(),
    players: players.map((p) => ({
      userId: p.user.id,
      username: p.user.username,
      avatarUrl: p.user.avatarUrl ?? null,
      score: p.sp.score,
      finalRank: p.sp.finalRank ?? null,
      isConnected: p.sp.isConnected,
      lastSeenAt: p.sp.lastSeenAt.toISOString(),
      joinedAt: p.sp.joinedAt.toISOString(),
    })),
  };
}

/** Seed the plugin's initial game state (no-op for games without a plugin). */
async function seedGameState(
  sessionId: string,
  roomId: string,
  gameId: string,
  playerIds: string[],
): Promise<void> {
  const state = gameRunner.initialState(gameId, playerIds);
  if (!state) return;
  const turnUserId = extractTurnUser(state);
  // version=1 is the row's default — seed always wins this write.
  await sessionsRepository.updateState(sessionId, state, 1, undefined, turnUserId);
  await gameRunner.onSessionStart({ id: sessionId, roomId, gameId, playerIds, state, round: 1 });
}

/** Convention: engines exposing playerOrder + currentTurnIndex get turn tracking for free. */
function extractTurnUser(state: Record<string, unknown>): string | undefined {
  const order = state['playerOrder'];
  const idx = state['currentTurnIndex'];
  if (Array.isArray(order) && typeof idx === 'number' && typeof order[idx] === 'string') {
    return order[idx] as string;
  }
  return undefined;
}

/**
 * Terminal transition + reward distribution, shared by the engine auto-finish
 * (submitAction) and the legacy client finish endpoint.
 *
 * markFinished is an atomic conditional update, so concurrent finish attempts
 * resolve to exactly ONE winner — only that caller distributes XP.
 */
async function finalizeSession(
  snapshot: {
    id: string;
    roomId: string;
    gameId: string;
    playerIds: string[];
    state: Record<string, unknown>;
    round: number;
  },
  results: Array<{ userId: string; score: number; finalRank: number }>,
): Promise<void> {
  const won = await sessionsRepository.markFinished(snapshot.id);
  if (!won) throw AppError.conflict('Session already finished');

  const isSolo = snapshot.playerIds.length === 1;

  // Persist results and distribute XP (cross-module service call).
  // Game plugins may override the XP table via engine.computeXP.
  for (const result of results) {
    await sessionsRepository.updatePlayerResult(
      snapshot.id,
      result.userId,
      result.score,
      result.finalRank,
    );
    const pluginXP = gameRunner.computeXP(
      snapshot.gameId,
      { userId: result.userId, score: result.score, finalRank: result.finalRank },
      isSolo,
    );
    const xpGain = pluginXP ?? (isSolo ? SOLO_XP : (XP_BY_RANK[result.finalRank] ?? DEFAULT_XP));
    const isWin = !isSolo && result.finalRank === 1;
    await usersService.addXP(result.userId, xpGain, isWin);
  }

  await db
    .update(roomsTable)
    .set({ status: 'finished' })
    .where(eq(roomsTable.id, snapshot.roomId));

  await gameRunner.onSessionFinish(
    snapshot,
    results.map((r) => ({ userId: r.userId, score: r.score, finalRank: r.finalRank })),
  );
}

// Loads a session and asserts the caller is one of its players.
async function getSessionForParticipant(sessionId: string, userId: string) {
  const session = await sessionsRepository.findById(sessionId);
  if (!session) throw AppError.notFound('Session not found');
  const players = await sessionsRepository.getPlayers(sessionId);
  if (!players.some((p) => p.user.id === userId)) {
    throw AppError.forbidden('You are not a participant of this session');
  }
  return { session, players };
}

export const sessionsService = {
  async startSession(roomId: string, gameId: string, hostId: string) {
    // ── Validation reads (outside tx — no writes yet) ─────────────────────────
    const [room] = await db.select().from(roomsTable).where(eq(roomsTable.id, roomId)).limit(1);
    if (!room) throw AppError.notFound('Room not found');
    if (room.hostId !== hostId) throw AppError.forbidden('Only the host can start the session');

    const [game] = await db.select().from(gamesTable).where(eq(gamesTable.id, gameId)).limit(1);
    if (!game) throw AppError.notFound('Game not found');

    const roomPlayers = await db
      .select()
      .from(roomPlayersTable)
      .where(eq(roomPlayersTable.roomId, roomId));

    const playerIds = roomPlayers.map((p) => p.userId);

    // ── Atomic mutations ───────────────────────────────────────────────────────
    // All writes happen in one transaction: session row, player rows, and room
    // status update. If any step fails, nothing is committed — no orphaned
    // sessions, no rooms stuck in 'in_game'.
    const sessionId = await db.transaction(async (tx) => {
      const sid = generateId();
      const now = new Date();

      await tx.insert(gameSessionsTable).values({
        id: sid,
        roomId,
        gameId,
        status: 'playing',
        round: 1,
        state: {},
        startedAt: now,
      });

      if (playerIds.length > 0) {
        await tx.insert(gameSessionPlayersTable).values(
          playerIds.map((userId) => ({
            id: generateId(),
            sessionId: sid,
            userId,
            score: 0,
            isConnected: true,
            lastSeenAt: now,
          })),
        );
      }

      await tx.update(roomsTable).set({ status: 'in_game' }).where(eq(roomsTable.id, roomId));

      return sid;
    });

    // seedGameState calls game hooks (onSessionStart) — runs after tx commits
    // so platform I/O (notifications etc.) never holds the transaction open.
    await seedGameState(sessionId, roomId, gameId, playerIds);

    return buildSession(sessionId);
  },

  async startSoloSession(gameId: string, userId: string) {
    // ── Validation read (outside tx) ──────────────────────────────────────────
    const [game] = await db.select().from(gamesTable).where(eq(gamesTable.id, gameId)).limit(1);
    if (!game) throw AppError.notFound('Game not found');

    // generateUniqueCode does SELECTs — run outside the tx to avoid holding a
    // slot during code-collision retries.
    const code = await roomsRepository.generateUniqueCode();

    // ── Atomic mutations ───────────────────────────────────────────────────────
    // Solo play reuses the room model: a private 1-player room that never
    // appears in the public lobby. All 5 writes are atomic: if any step fails,
    // nothing is committed — no orphaned rooms, no sessions without players.
    const { roomId, sessionId } = await db.transaction(async (tx) => {
      const rid = generateId();
      const now = new Date();

      await tx.insert(roomsTable).values({
        id: rid,
        gameId,
        name: 'Solo',
        code,
        hostId: userId,
        maxPlayers: 1,
        currentPlayers: 1,
        status: 'waiting',
        isPrivate: true,
      });

      await tx.insert(roomPlayersTable).values({
        id: generateId(),
        roomId: rid,
        userId,
        isHost: true,
      });

      const sid = generateId();

      await tx.insert(gameSessionsTable).values({
        id: sid,
        roomId: rid,
        gameId,
        status: 'playing',
        round: 1,
        state: {},
        startedAt: now,
      });

      await tx.insert(gameSessionPlayersTable).values([
        {
          id: generateId(),
          sessionId: sid,
          userId,
          score: 0,
          isConnected: true,
          lastSeenAt: now,
        },
      ]);

      await tx.update(roomsTable).set({ status: 'in_game' }).where(eq(roomsTable.id, rid));

      return { roomId: rid, sessionId: sid };
    });

    // seedGameState calls game hooks — runs after tx commits.
    await seedGameState(sessionId, roomId, gameId, [userId]);

    return buildSession(sessionId);
  },

  /**
   * Route one player action into the game plugin's engine.
   * Auto-finishes the session when the engine reports the game is over.
   */
  async submitAction(
    sessionId: string,
    userId: string,
    action: { type: string; payload: Record<string, unknown> },
  ) {
    const { session, players } = await getSessionForParticipant(sessionId, userId);
    if (session.status !== 'playing') {
      throw AppError.conflict(`Session is not playing (current: ${session.status})`);
    }

    const snapshot = {
      id: session.id,
      roomId: session.roomId,
      gameId: session.gameId,
      playerIds: players.map((p) => p.user.id),
      state: (session.state ?? {}) as Record<string, unknown>,
      round: session.round,
    };

    const outcome = await gameRunner.processAction(snapshot, userId, action);

    // Optimistic lock: only write if no other action was processed concurrently.
    // version must still match what we read — if not, another request won the race.
    const turnUserId = extractTurnUser(outcome.state);
    const written = await sessionsRepository.updateState(
      sessionId,
      outcome.state,
      session.version,
      undefined,
      turnUserId,
    );
    if (!written) {
      throw AppError.conflict(
        'Another action was processed at the same time. Please try again.',
      );
    }

    if (outcome.finished && outcome.results) {
      // Server-authoritative finish: results come from the engine, never the client.
      await finalizeSession(
        { ...snapshot, state: outcome.state },
        outcome.results.map((r) => ({
          userId: r.userId,
          score: r.score,
          finalRank: r.finalRank,
        })),
      );
    }

    return buildSession(sessionId);
  },

  async getRoomCurrentSession(roomId: string, userId: string) {
    const session = await sessionsRepository.findActiveByRoom(roomId);
    if (!session) throw AppError.notFound('No active session for this room');
    const players = await sessionsRepository.getPlayers(session.id);
    if (!players.some((p) => p.user.id === userId)) {
      throw AppError.forbidden('You are not a participant of this session');
    }
    return buildSession(session.id);
  },

  async getSession(sessionId: string, userId: string) {
    await getSessionForParticipant(sessionId, userId);
    return buildSession(sessionId);
  },

  async pauseSession(sessionId: string, userId: string) {
    const { session } = await getSessionForParticipant(sessionId, userId);
    if (session.status !== 'playing') {
      throw AppError.conflict(`Session is not playing (current: ${session.status})`);
    }
    await sessionsRepository.updateStatus(sessionId, 'paused', { pausedAt: new Date() });
    return buildSession(sessionId);
  },

  async resumeSession(sessionId: string, userId: string) {
    const { session } = await getSessionForParticipant(sessionId, userId);
    if (session.status !== 'paused') {
      throw AppError.conflict(`Session is not paused (current: ${session.status})`);
    }
    await sessionsRepository.updateStatus(sessionId, 'playing', { resumedAt: new Date() });
    return buildSession(sessionId);
  },

  async updateState(
    sessionId: string,
    userId: string,
    state: Record<string, unknown>,
    round?: number,
    currentTurnUserId?: string,
  ) {
    const { session } = await getSessionForParticipant(sessionId, userId);
    if (session.status === 'finished' || session.status === 'abandoned') {
      throw AppError.conflict('Cannot update state of a finished session');
    }
    // Pass the current version as the optimistic-lock sentinel.
    // If a concurrent write already bumped the version, updateState returns false
    // and the caller gets a 409 from the repository layer.
    await sessionsRepository.updateState(sessionId, state, session.version, round, currentTurnUserId);
    return buildSession(sessionId);
  },

  async finishSession(
    sessionId: string,
    userId: string,
    results: Array<{ userId: string; score: number; finalRank: number }>,
  ) {
    const { session, players } = await getSessionForParticipant(sessionId, userId);
    if (session.status === 'finished') throw AppError.conflict('Session already finished');

    // Plugin-backed games are server-authoritative: the ONLY way to finish
    // them is through the engine (submitAction → auto-finish). Accepting
    // client-supplied results here would allow arbitrary XP farming.
    if (gameRunner.hasPlugin(session.gameId)) {
      throw AppError.forbidden('This game is managed by the game engine; results are computed server-side');
    }

    // Legacy (non-plugin) games: validate results server-side — every entry
    // must be a real participant and appear at most once, otherwise the
    // client could farm XP by repeating or injecting arbitrary user IDs.
    const participantIds = new Set(players.map((p) => p.user.id));
    const seen = new Set<string>();
    for (const result of results) {
      if (!participantIds.has(result.userId)) {
        throw AppError.badRequest(`User ${result.userId} is not a participant of this session`);
      }
      if (seen.has(result.userId)) {
        throw AppError.badRequest(`Duplicate result for user ${result.userId}`);
      }
      seen.add(result.userId);
    }

    await finalizeSession(
      {
        id: sessionId,
        roomId: session.roomId,
        gameId: session.gameId,
        playerIds: players.map((p) => p.user.id),
        state: (session.state ?? {}) as Record<string, unknown>,
        round: session.round,
      },
      results,
    );

    return buildSession(sessionId);
  },

  async updatePlayerConnection(
    sessionId: string,
    callerId: string,
    targetUserId: string,
    isConnected: boolean,
  ) {
    await getSessionForParticipant(sessionId, callerId);
    // A player may only report their own connection status.
    if (callerId !== targetUserId) {
      throw AppError.forbidden('You can only update your own connection status');
    }
    await sessionsRepository.updatePlayerConnection(sessionId, targetUserId, isConnected);
    return buildSession(sessionId);
  },
};
