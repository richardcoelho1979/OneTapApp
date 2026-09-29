import { eq, desc, inArray, or } from 'drizzle-orm';
import { db, usersTable, friendshipsTable } from '@workspace/db';

export const rankingsRepository = {
  async getGlobal(limit = 50) {
    return db
      .select()
      .from(usersTable)
      .orderBy(desc(usersTable.xp))
      .limit(limit);
  },

  /**
   * Returns ranked leaderboard for a user and all their friends in a single
   * SQL query — no in-memory filtering or artificial user cap.
   *
   * Strategy: subquery the friendship table for the user's friend IDs, then
   * SELECT from users WHERE id IN (userId, ...friendIds) ORDER BY xp DESC.
   * Drizzle's inArray translates to a single parameterized WHERE id = ANY($1),
   * which is index-friendly and scales to any number of users.
   *
   * The user themselves is always included (rank is shown relative to friends).
   */
  async getFriendsRanking(userId: string) {
    // Step 1: fetch friend IDs for this user (both directions).
    // friendships table stores the relationship from the requester's perspective:
    // userId → friendId. We only read outbound edges here (the friends module
    // stores both directions when a friendship is accepted).
    const friendRows = await db
      .select({ friendId: friendshipsTable.friendId })
      .from(friendshipsTable)
      .where(eq(friendshipsTable.userId, userId));

    const friendIds = friendRows.map((r) => r.friendId);
    const participantIds = [userId, ...friendIds];

    // Step 2: fetch all participants in one query, ordered by XP descending.
    // inArray(col, []) would produce invalid SQL — guard against empty list.
    if (participantIds.length === 0) {
      return db
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, userId))
        .orderBy(desc(usersTable.xp));
    }

    return db
      .select()
      .from(usersTable)
      .where(inArray(usersTable.id, participantIds))
      .orderBy(desc(usersTable.xp));
  },
};
