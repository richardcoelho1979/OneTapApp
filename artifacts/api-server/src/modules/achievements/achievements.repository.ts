import { db, achievementsTable } from '@workspace/db';

export const achievementsRepository = {
  async getAll() {
    return db.select().from(achievementsTable);
  },
};
