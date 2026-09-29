import { eq, like } from 'drizzle-orm';
import { db, usersTable, userAchievementsTable, achievementsTable } from '@workspace/db';

export const usersRepository = {
  async findById(id: string) {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, id))
      .limit(1);
    return user ?? null;
  },

  async update(id: string, data: Partial<typeof usersTable.$inferInsert>) {
    const [updated] = await db
      .update(usersTable)
      .set(data)
      .where(eq(usersTable.id, id))
      .returning();
    return updated ?? null;
  },

  async searchByUsername(query: string, limit = 20) {
    return db
      .select()
      .from(usersTable)
      .where(like(usersTable.username, `%${query}%`))
      .limit(limit);
  },

  async addXP(userId: string, xpGain: number, isWinner: boolean) {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);
    if (!user) return null;

    const newXp = user.xp + xpGain;
    const newLevel = Math.floor(Math.sqrt(newXp / 100)) + 1;

    const [updated] = await db
      .update(usersTable)
      .set({
        xp: newXp,
        level: newLevel,
        gamesPlayed: user.gamesPlayed + 1,
        wins: isWinner ? user.wins + 1 : user.wins,
      })
      .where(eq(usersTable.id, userId))
      .returning();
    return updated ?? null;
  },

  async getUserAchievements(userId: string) {
    return db
      .select({
        achievement: achievementsTable,
        unlockedAt: userAchievementsTable.unlockedAt,
      })
      .from(userAchievementsTable)
      .innerJoin(
        achievementsTable,
        eq(userAchievementsTable.achievementId, achievementsTable.id),
      )
      .where(eq(userAchievementsTable.userId, userId));
  },
};
