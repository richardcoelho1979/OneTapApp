import { eq } from 'drizzle-orm';
import { db, seasonsTable } from '@workspace/db';

export const seasonsRepository = {
  async getAll() {
    return db.select().from(seasonsTable).orderBy(seasonsTable.number);
  },
  async getCurrent() {
    const [s] = await db
      .select()
      .from(seasonsTable)
      .where(eq(seasonsTable.isActive, true))
      .limit(1);
    return s ?? null;
  },
};
