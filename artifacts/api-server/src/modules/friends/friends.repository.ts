import { eq, and, or } from 'drizzle-orm';
import { db, usersTable, friendRequestsTable, friendshipsTable } from '@workspace/db';
import { generateId } from '../../lib/auth';

export const friendsRepository = {
  async getFriends(userId: string) {
    return db
      .select({ friendship: friendshipsTable, friend: usersTable })
      .from(friendshipsTable)
      .innerJoin(usersTable, eq(friendshipsTable.friendId, usersTable.id))
      .where(eq(friendshipsTable.userId, userId));
  },

  async areFriends(userA: string, userB: string): Promise<boolean> {
    const rows = await db
      .select({ id: friendshipsTable.id })
      .from(friendshipsTable)
      .where(
        or(
          and(eq(friendshipsTable.userId, userA), eq(friendshipsTable.friendId, userB)),
          and(eq(friendshipsTable.userId, userB), eq(friendshipsTable.friendId, userA)),
        ),
      )
      .limit(1);
    return rows.length > 0;
  },

  async hasPendingRequest(fromUserId: string, toUserId: string): Promise<boolean> {
    const rows = await db
      .select({ id: friendRequestsTable.id })
      .from(friendRequestsTable)
      .where(
        and(
          eq(friendRequestsTable.fromUserId, fromUserId),
          eq(friendRequestsTable.toUserId, toUserId),
          eq(friendRequestsTable.status, 'pending'),
        ),
      )
      .limit(1);
    return rows.length > 0;
  },

  async createRequest(fromUserId: string, toUserId: string) {
    const [req] = await db
      .insert(friendRequestsTable)
      .values({ id: generateId(), fromUserId, toUserId, status: 'pending' })
      .returning();
    return req!;
  },

  async getIncomingRequests(userId: string) {
    return db
      .select({ request: friendRequestsTable, fromUser: usersTable })
      .from(friendRequestsTable)
      .innerJoin(usersTable, eq(friendRequestsTable.fromUserId, usersTable.id))
      .where(
        and(
          eq(friendRequestsTable.toUserId, userId),
          eq(friendRequestsTable.status, 'pending'),
        ),
      );
  },

  async getSentRequests(userId: string) {
    return db
      .select({ request: friendRequestsTable, toUser: usersTable })
      .from(friendRequestsTable)
      .innerJoin(usersTable, eq(friendRequestsTable.toUserId, usersTable.id))
      .where(
        and(
          eq(friendRequestsTable.fromUserId, userId),
          eq(friendRequestsTable.status, 'pending'),
        ),
      );
  },

  async findRequest(requestId: string, toUserId: string) {
    const [req] = await db
      .select()
      .from(friendRequestsTable)
      .where(
        and(
          eq(friendRequestsTable.id, requestId),
          eq(friendRequestsTable.toUserId, toUserId),
          eq(friendRequestsTable.status, 'pending'),
        ),
      )
      .limit(1);
    return req ?? null;
  },

  async updateRequestStatus(requestId: string, status: 'accepted' | 'rejected') {
    const [updated] = await db
      .update(friendRequestsTable)
      .set({ status })
      .where(eq(friendRequestsTable.id, requestId))
      .returning();
    return updated!;
  },

  async createFriendship(userA: string, userB: string) {
    // Both rows are atomic: friendship is always bidirectional or not created at all.
    await db.transaction(async (tx) => {
      await tx.insert(friendshipsTable).values([
        { id: generateId(), userId: userA, friendId: userB },
        { id: generateId(), userId: userB, friendId: userA },
      ]);
    });
  },

  async deleteFriendship(userId: string, friendId: string) {
    await db
      .delete(friendshipsTable)
      .where(
        or(
          and(eq(friendshipsTable.userId, userId), eq(friendshipsTable.friendId, friendId)),
          and(eq(friendshipsTable.userId, friendId), eq(friendshipsTable.friendId, userId)),
        ),
      );
  },

  async isFriend(userId: string, friendId: string): Promise<boolean> {
    const rows = await db
      .select({ id: friendshipsTable.id })
      .from(friendshipsTable)
      .where(and(eq(friendshipsTable.userId, userId), eq(friendshipsTable.friendId, friendId)))
      .limit(1);
    return rows.length > 0;
  },
};
