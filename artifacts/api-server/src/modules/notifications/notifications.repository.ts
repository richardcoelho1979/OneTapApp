import { eq, and } from 'drizzle-orm';
import { db, notificationsTable } from '@workspace/db';
import { generateId } from '../../lib/auth';

export const notificationsRepository = {
  async getForUser(userId: string, unreadOnly = false) {
    const conditions = unreadOnly
      ? and(eq(notificationsTable.userId, userId), eq(notificationsTable.isRead, false))
      : eq(notificationsTable.userId, userId);

    return db
      .select()
      .from(notificationsTable)
      .where(conditions)
      .orderBy(notificationsTable.createdAt)
      .limit(50);
  },

  async markRead(notificationId: string, userId: string) {
    const [updated] = await db
      .update(notificationsTable)
      .set({ isRead: true })
      .where(
        and(
          eq(notificationsTable.id, notificationId),
          eq(notificationsTable.userId, userId),
        ),
      )
      .returning();
    return updated ?? null;
  },

  async markAllRead(userId: string) {
    await db
      .update(notificationsTable)
      .set({ isRead: true })
      .where(eq(notificationsTable.userId, userId));
  },

  async create(data: {
    userId: string;
    type: 'friend_request' | 'friend_accepted' | 'room_invite' | 'achievement_unlocked' | 'season_start' | 'season_end' | 'system';
    title: string;
    body: string;
    data?: Record<string, unknown>;
  }) {
    const [n] = await db
      .insert(notificationsTable)
      .values({ id: generateId(), ...data })
      .returning();
    return n!;
  },
};
