import { eq, and } from 'drizzle-orm';
import { db, usersTable, roomsTable, roomPlayersTable } from '@workspace/db';
import { generateId, generateRoomCode } from '../../lib/auth';

export const roomsRepository = {
  async getActivePublicRooms(limit = 20) {
    return db
      .select()
      .from(roomsTable)
      .where(and(eq(roomsTable.status, 'waiting'), eq(roomsTable.isPrivate, false)))
      .limit(limit);
  },

  async findById(roomId: string) {
    const [room] = await db
      .select()
      .from(roomsTable)
      .where(eq(roomsTable.id, roomId))
      .limit(1);
    return room ?? null;
  },

  async findByCode(code: string) {
    const [room] = await db
      .select()
      .from(roomsTable)
      .where(eq(roomsTable.code, code.toUpperCase()))
      .limit(1);
    return room ?? null;
  },

  async isCodeTaken(code: string): Promise<boolean> {
    const rows = await db
      .select({ id: roomsTable.id })
      .from(roomsTable)
      .where(eq(roomsTable.code, code))
      .limit(1);
    return rows.length > 0;
  },

  async generateUniqueCode(): Promise<string> {
    let code = generateRoomCode();
    while (await roomsRepository.isCodeTaken(code)) {
      code = generateRoomCode();
    }
    return code;
  },

  async create(data: {
    name: string;
    hostId: string;
    maxPlayers: number;
    isPrivate: boolean;
    gameId?: string | null;
  }) {
    const roomId = generateId();
    // generateUniqueCode runs SELECTs — keep outside the transaction to avoid
    // holding a tx slot during retries on code collision.
    const code = await roomsRepository.generateUniqueCode();

    // Both inserts are atomic: a room always has a host player, never orphaned.
    await db.transaction(async (tx) => {
      await tx.insert(roomsTable).values({
        id: roomId,
        gameId: data.gameId ?? null,
        name: data.name,
        code,
        hostId: data.hostId,
        maxPlayers: data.maxPlayers,
        currentPlayers: 1,
        status: 'waiting',
        isPrivate: data.isPrivate,
      });

      await tx.insert(roomPlayersTable).values({
        id: generateId(),
        roomId,
        userId: data.hostId,
        isHost: true,
      });
    });

    return roomId;
  },

  async delete(roomId: string) {
    await db.delete(roomsTable).where(eq(roomsTable.id, roomId));
  },

  async getPlayers(roomId: string) {
    return db
      .select({ player: roomPlayersTable, user: usersTable })
      .from(roomPlayersTable)
      .innerJoin(usersTable, eq(roomPlayersTable.userId, usersTable.id))
      .where(eq(roomPlayersTable.roomId, roomId));
  },

  async findPlayer(roomId: string, userId: string) {
    const [p] = await db
      .select()
      .from(roomPlayersTable)
      .where(and(eq(roomPlayersTable.roomId, roomId), eq(roomPlayersTable.userId, userId)))
      .limit(1);
    return p ?? null;
  },

  async addPlayer(roomId: string, userId: string) {
    await db.insert(roomPlayersTable).values({
      id: generateId(),
      roomId,
      userId,
      isHost: false,
    });
  },

  async removePlayer(roomId: string, userId: string) {
    await db
      .delete(roomPlayersTable)
      .where(and(eq(roomPlayersTable.roomId, roomId), eq(roomPlayersTable.userId, userId)));
  },

  async updatePlayerCount(roomId: string, count: number) {
    await db
      .update(roomsTable)
      .set({ currentPlayers: count })
      .where(eq(roomsTable.id, roomId));
  },

  async setStatus(roomId: string, status: typeof roomsTable.$inferInsert['status']) {
    await db.update(roomsTable).set({ status }).where(eq(roomsTable.id, roomId));
  },

  async transferHost(roomId: string) {
    const [newHost] = await db
      .select()
      .from(roomPlayersTable)
      .where(eq(roomPlayersTable.roomId, roomId))
      .limit(1);

    if (newHost) {
      await db
        .update(roomPlayersTable)
        .set({ isHost: true })
        .where(eq(roomPlayersTable.id, newHost.id));
      await db
        .update(roomsTable)
        .set({ hostId: newHost.userId })
        .where(eq(roomsTable.id, roomId));
    }
  },
};
