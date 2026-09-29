import { eq, and, ne, desc, sql } from 'drizzle-orm';
import { db, gameSessionsTable, gameSessionPlayersTable, usersTable } from '@workspace/db';
import { generateId } from '../../lib/auth';

export const sessionsRepository = {
  async create(data: {
    roomId: string;
    gameId: string;
    playerIds: string[];
  }) {
    const sessionId = generateId();
    const now = new Date();

    // Both inserts are atomic: a session always has its players registered,
    // never created in a half-initialised state.
    await db.transaction(async (tx) => {
      await tx.insert(gameSessionsTable).values({
        id: sessionId,
        roomId: data.roomId,
        gameId: data.gameId,
        status: 'playing',
        round: 1,
        state: {},
        startedAt: now,
      });

      if (data.playerIds.length > 0) {
        await tx.insert(gameSessionPlayersTable).values(
          data.playerIds.map((userId) => ({
            id: generateId(),
            sessionId,
            userId,
            score: 0,
            isConnected: true,
            lastSeenAt: now,
          })),
        );
      }
    });

    return sessionId;
  },

  async findById(sessionId: string) {
    const [s] = await db
      .select()
      .from(gameSessionsTable)
      .where(eq(gameSessionsTable.id, sessionId))
      .limit(1);
    return s ?? null;
  },

  async findActiveByRoom(roomId: string) {
    const [s] = await db
      .select()
      .from(gameSessionsTable)
      .where(eq(gameSessionsTable.roomId, roomId))
      .orderBy(desc(gameSessionsTable.createdAt))
      .limit(1);
    if (!s || s.status === 'finished' || s.status === 'abandoned') return null;
    return s;
  },

  async getPlayers(sessionId: string) {
    return db
      .select({ sp: gameSessionPlayersTable, user: usersTable })
      .from(gameSessionPlayersTable)
      .innerJoin(usersTable, eq(gameSessionPlayersTable.userId, usersTable.id))
      .where(eq(gameSessionPlayersTable.sessionId, sessionId));
  },

  async updateStatus(
    sessionId: string,
    status: typeof gameSessionsTable.$inferInsert['status'],
    timestamps?: Partial<{
      startedAt: Date;
      pausedAt: Date;
      resumedAt: Date;
      finishedAt: Date;
    }>,
  ) {
    await db
      .update(gameSessionsTable)
      .set({ status, ...timestamps })
      .where(eq(gameSessionsTable.id, sessionId));
  },

  /**
   * Atomic terminal transition: only ONE caller can move a session to
   * 'finished'. Returns false when another call already finished it — the
   * caller must then skip reward distribution (prevents double XP).
   */
  async markFinished(sessionId: string) {
    const rows = await db
      .update(gameSessionsTable)
      .set({ status: 'finished', finishedAt: new Date() })
      .where(
        and(
          eq(gameSessionsTable.id, sessionId),
          ne(gameSessionsTable.status, 'finished'),
          ne(gameSessionsTable.status, 'abandoned'),
        ),
      )
      .returning({ id: gameSessionsTable.id });
    return rows.length > 0;
  },

  /**
   * Optimistic-lock update: only writes when the row still has `expectedVersion`.
   * Returns true when the write succeeded, false when another action already
   * incremented the version (concurrent write detected).
   */
  async updateState(
    sessionId: string,
    state: Record<string, unknown>,
    expectedVersion: number,
    round?: number,
    currentTurnUserId?: string,
  ): Promise<boolean> {
    // Build optional fields separately so TypeScript infers scalar types correctly.
    // `version` uses a SQL expression (atomic increment) and cannot sit in a
    // Partial<$inferInsert> typed object — pass it directly in set() instead.
    const optionals: Partial<typeof gameSessionsTable.$inferInsert> = {};
    if (round !== undefined) optionals.round = round;
    if (currentTurnUserId !== undefined) optionals.currentTurnUserId = currentTurnUserId;

    const rows = await db
      .update(gameSessionsTable)
      .set({ state, version: sql`${gameSessionsTable.version} + 1`, ...optionals })
      .where(
        and(
          eq(gameSessionsTable.id, sessionId),
          eq(gameSessionsTable.version, expectedVersion),
        ),
      )
      .returning({ id: gameSessionsTable.id });
    return rows.length > 0;
  },

  async updatePlayerResult(
    sessionId: string,
    userId: string,
    score: number,
    finalRank: number,
  ) {
    await db
      .update(gameSessionPlayersTable)
      .set({ score, finalRank })
      .where(
        and(
          eq(gameSessionPlayersTable.sessionId, sessionId),
          eq(gameSessionPlayersTable.userId, userId),
        ),
      );
  },

  async updatePlayerConnection(
    sessionId: string,
    userId: string,
    isConnected: boolean,
  ) {
    await db
      .update(gameSessionPlayersTable)
      .set({ isConnected, lastSeenAt: new Date() })
      .where(
        and(
          eq(gameSessionPlayersTable.sessionId, sessionId),
          eq(gameSessionPlayersTable.userId, userId),
        ),
      );
  },
};
