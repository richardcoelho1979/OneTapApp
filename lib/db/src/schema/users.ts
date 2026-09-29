import { pgTable, text, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const onlineStatusEnum = pgEnum("online_status", ["online", "away", "offline"]);
export const languageEnum = pgEnum("language", ["pt", "en"]);

export const usersTable = pgTable("users", {
  id: text("id").primaryKey(), // UUID generated in app
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"), // null for OAuth-only users
  avatarUrl: text("avatar_url"),
  bio: text("bio"),
  level: integer("level").notNull().default(1),
  xp: integer("xp").notNull().default(0),
  country: text("country"),
  language: languageEnum("language").notNull().default("pt"),
  isPlusMember: boolean("is_plus_member").notNull().default(false),
  onlineStatus: onlineStatusEnum("online_status").notNull().default("offline"),
  gamesPlayed: integer("games_played").notNull().default(0),
  wins: integer("wins").notNull().default(0),
  googleId: text("google_id").unique(),
  appleId: text("apple_id").unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ createdAt: true, updatedAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
