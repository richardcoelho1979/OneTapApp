import { pgTable, text, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const roomStatusEnum = pgEnum("room_status", ["waiting", "in_game", "finished"]);

export const roomsTable = pgTable("rooms", {
  id: text("id").primaryKey(),
  gameId: text("game_id"),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  hostId: text("host_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  maxPlayers: integer("max_players").notNull(),
  currentPlayers: integer("current_players").notNull().default(1),
  status: roomStatusEnum("status").notNull().default("waiting"),
  isPrivate: boolean("is_private").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const roomPlayersTable = pgTable("room_players", {
  id: text("id").primaryKey(),
  roomId: text("room_id").notNull().references(() => roomsTable.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  isHost: boolean("is_host").notNull().default(false),
  joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertRoomSchema = createInsertSchema(roomsTable).omit({ createdAt: true, updatedAt: true });
export type InsertRoom = z.infer<typeof insertRoomSchema>;
export type Room = typeof roomsTable.$inferSelect;

export const insertRoomPlayerSchema = createInsertSchema(roomPlayersTable).omit({ joinedAt: true });
export type InsertRoomPlayer = z.infer<typeof insertRoomPlayerSchema>;
export type RoomPlayer = typeof roomPlayersTable.$inferSelect;
