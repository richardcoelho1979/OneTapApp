import { pgTable, text, integer, boolean, timestamp, pgEnum, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { roomsTable } from "./rooms";
import { gamesTable } from "./games";

export const gameSessionStatusEnum = pgEnum("game_session_status", [
  "waiting",   // sala iniciou mas o jogo ainda não começou
  "playing",   // jogo em andamento
  "paused",    // pausado por um dos jogadores
  "finished",  // jogo encerrado normalmente
  "abandoned", // encerrado por falta de jogadores
]);

export const gameSessionsTable = pgTable("game_sessions", {
  id:                text("id").primaryKey(),
  roomId:            text("room_id").notNull().references(() => roomsTable.id, { onDelete: "cascade" }),
  gameId:            text("game_id").notNull().references(() => gamesTable.id, { onDelete: "restrict" }),

  status:            gameSessionStatusEnum("status").notNull().default("waiting"),

  // Estado completo do jogo em JSONB — cada jogo define sua própria estrutura.
  // Ex: { round: 2, currentCard: "...", deck: [...], board: {...} }
  state:             jsonb("state").default({}),

  // Controle de turno (para jogos por turnos)
  round:             integer("round").notNull().default(1),
  currentTurnUserId: text("current_turn_user_id").references(() => usersTable.id, { onDelete: "set null" }),

  // Optimistic lock — incrementado a cada updateState; evita overwrites concorrentes.
  version:           integer("version").notNull().default(1),

  // Timestamps de ciclo de vida
  startedAt:         timestamp("started_at", { withTimezone: true }),
  pausedAt:          timestamp("paused_at", { withTimezone: true }),
  resumedAt:         timestamp("resumed_at", { withTimezone: true }),
  finishedAt:        timestamp("finished_at", { withTimezone: true }),

  createdAt:         timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt:         timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const gameSessionPlayersTable = pgTable("game_session_players", {
  id:            text("id").primaryKey(),
  sessionId:     text("session_id").notNull().references(() => gameSessionsTable.id, { onDelete: "cascade" }),
  userId:        text("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),

  score:         integer("score").notNull().default(0),
  finalRank:     integer("final_rank"),      // preenchido ao fim do jogo (1º, 2º, ...)
  isConnected:   boolean("is_connected").notNull().default(true),
  lastSeenAt:    timestamp("last_seen_at", { withTimezone: true }).notNull().defaultNow(),

  joinedAt:      timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── Tipos TypeScript ───────────────────────────────────────────────────────

export const insertGameSessionSchema = createInsertSchema(gameSessionsTable).omit({
  createdAt: true,
  updatedAt: true,
});
export type InsertGameSession = z.infer<typeof insertGameSessionSchema>;
export type GameSession = typeof gameSessionsTable.$inferSelect;

export const insertGameSessionPlayerSchema = createInsertSchema(gameSessionPlayersTable).omit({
  joinedAt: true,
});
export type InsertGameSessionPlayer = z.infer<typeof insertGameSessionPlayerSchema>;
export type GameSessionPlayer = typeof gameSessionPlayersTable.$inferSelect;
