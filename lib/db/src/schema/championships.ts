import { pgTable, text, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const championshipStatusEnum = pgEnum("championship_status", ["upcoming", "active", "finished"]);

export const championshipsTable = pgTable("championships", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  gameId: text("game_id"),
  description: text("description"),
  status: championshipStatusEnum("status").notNull().default("upcoming"),
  startDate: timestamp("start_date", { withTimezone: true }).notNull(),
  endDate: timestamp("end_date", { withTimezone: true }).notNull(),
  maxParticipants: integer("max_participants").notNull(),
  currentParticipants: integer("current_participants").notNull().default(0),
  prizeDescription: text("prize_description"),
  isExclusive: boolean("is_exclusive").notNull().default(false),
  bannerUrl: text("banner_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertChampionshipSchema = createInsertSchema(championshipsTable).omit({ createdAt: true });
export type InsertChampionship = z.infer<typeof insertChampionshipSchema>;
export type Championship = typeof championshipsTable.$inferSelect;
