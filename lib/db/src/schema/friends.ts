import { pgTable, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const friendRequestStatusEnum = pgEnum("friend_request_status", ["pending", "accepted", "rejected"]);

export const friendRequestsTable = pgTable("friend_requests", {
  id: text("id").primaryKey(),
  fromUserId: text("from_user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  toUserId: text("to_user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  status: friendRequestStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const friendshipsTable = pgTable("friendships", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  friendId: text("friend_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertFriendRequestSchema = createInsertSchema(friendRequestsTable).omit({ createdAt: true, updatedAt: true });
export type InsertFriendRequest = z.infer<typeof insertFriendRequestSchema>;
export type FriendRequest = typeof friendRequestsTable.$inferSelect;

export const insertFriendshipSchema = createInsertSchema(friendshipsTable).omit({ createdAt: true });
export type InsertFriendship = z.infer<typeof insertFriendshipSchema>;
export type Friendship = typeof friendshipsTable.$inferSelect;
