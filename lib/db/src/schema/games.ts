import { pgTable, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const gamesTable = pgTable("games", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  minPlayers: integer("min_players").notNull().default(2),
  maxPlayers: integer("max_players").notNull(),
  averageDuration: integer("average_duration").notNull().default(180), // seconds
  iconUrl: text("icon_url"),
  isActive: boolean("is_active").notNull().default(true),
  isPlusExclusive: boolean("is_plus_exclusive").notNull().default(false),
  tags: text("tags").array().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertGameSchema = createInsertSchema(gamesTable).omit({ createdAt: true });
export type InsertGame = z.infer<typeof insertGameSchema>;
export type Game = typeof gamesTable.$inferSelect;
