import { pgTable, text, integer, boolean, timestamp, pgEnum, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const achievementCategoryEnum = pgEnum("achievement_category", [
  "social",
  "competitive",
  "explorer",
  "milestone",
  "seasonal",
]);

export const achievementsTable = pgTable("achievements", {
  id: text("id").primaryKey(),
  key: text("key").notNull().unique(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
  category: achievementCategoryEnum("category").notNull(),
  xpReward: integer("xp_reward").notNull().default(0),
  isSecret: boolean("is_secret").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const userAchievementsTable = pgTable("user_achievements", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  achievementId: text("achievement_id").notNull().references(() => achievementsTable.id, { onDelete: "cascade" }),
  unlockedAt: timestamp("unlocked_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  // Awarding is concurrent (game hooks) — the DB is the dedup authority.
  unique("user_achievements_user_achievement_unique").on(t.userId, t.achievementId),
]);

export const insertAchievementSchema = createInsertSchema(achievementsTable).omit({ createdAt: true });
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;
export type Achievement = typeof achievementsTable.$inferSelect;

export const insertUserAchievementSchema = createInsertSchema(userAchievementsTable).omit({ unlockedAt: true });
export type InsertUserAchievement = z.infer<typeof insertUserAchievementSchema>;
export type UserAchievement = typeof userAchievementsTable.$inferSelect;
