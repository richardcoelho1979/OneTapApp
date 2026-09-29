import { eq } from 'drizzle-orm';
import { db, championshipsTable } from '@workspace/db';

export const championshipsRepository = {
  async getAll(status?: 'upcoming' | 'active' | 'finished') {
    if (status) {
      return db
        .select()
        .from(championshipsTable)
        .where(eq(championshipsTable.status, status));
    }
    return db.select().from(championshipsTable);
  },

  async findById(id: string) {
    const [c] = await db
      .select()
      .from(championshipsTable)
      .where(eq(championshipsTable.id, id))
      .limit(1);
    return c ?? null;
  },
};
