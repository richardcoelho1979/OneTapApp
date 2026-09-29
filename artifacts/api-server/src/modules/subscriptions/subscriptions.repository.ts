import { eq } from 'drizzle-orm';
import { db, subscriptionsTable } from '@workspace/db';

export const subscriptionsRepository = {
  async findByUser(userId: string) {
    const [s] = await db
      .select()
      .from(subscriptionsTable)
      .where(eq(subscriptionsTable.userId, userId))
      .limit(1);
    return s ?? null;
  },
};
