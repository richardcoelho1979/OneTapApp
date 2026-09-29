import { eq } from 'drizzle-orm';
import { db, gamesTable } from '@workspace/db';

export const gamesRepository = {
  async getActive() {
    return db.select().from(gamesTable).where(eq(gamesTable.isActive, true));
  },
};
