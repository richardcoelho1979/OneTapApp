/**
 * OneTap Platform — Database Seed Script
 * Run: pnpm --filter @workspace/scripts run seed
 *
 * Seeds: achievements, games, and the first season.
 */
import { db } from "@workspace/db";
import {
  achievementsTable,
  seasonsTable,
  gamesTable,
} from "@workspace/db";

function generateId(): string {
  return crypto.randomUUID();
}

const achievements = [
  // Social
  { key: "first_friend", title: "Primeiro Amigo", description: "Adicione seu primeiro amigo no OneTap", icon: "people", category: "social" as const, xpReward: 50 },
  { key: "social_butterfly", title: "Borboleta Social", description: "Tenha 10 amigos no OneTap", icon: "people-circle", category: "social" as const, xpReward: 150 },
  { key: "party_starter", title: "Animador da Festa", description: "Crie sua primeira sala", icon: "add-circle", category: "social" as const, xpReward: 100 },
  // Competitive
  { key: "first_win", title: "Primeira Vitória", description: "Vença sua primeira partida", icon: "trophy", category: "competitive" as const, xpReward: 100 },
  { key: "hot_streak", title: "Em Chamas", description: "Vença 5 partidas seguidas", icon: "flame", category: "competitive" as const, xpReward: 300 },
  { key: "champion", title: "Campeão", description: "Alcance o Top 10 do ranking global", icon: "medal", category: "competitive" as const, xpReward: 500 },
  // Explorer
  { key: "game_explorer", title: "Explorador", description: "Jogue todos os jogos disponíveis", icon: "compass", category: "explorer" as const, xpReward: 200 },
  { key: "room_hopper", title: "Sala Livre", description: "Entre em 10 salas diferentes", icon: "swap-horizontal", category: "explorer" as const, xpReward: 150 },
  // Milestone
  { key: "level_10", title: "Nível 10", description: "Alcance o nível 10", icon: "star", category: "milestone" as const, xpReward: 200 },
  { key: "level_25", title: "Nível 25", description: "Alcance o nível 25", icon: "star-half", category: "milestone" as const, xpReward: 500 },
  { key: "games_50", title: "50 Partidas", description: "Jogue 50 partidas no OneTap", icon: "game-controller", category: "milestone" as const, xpReward: 300 },
  // Seasonal
  { key: "season1_participant", title: "Temporada 1", description: "Participou da Temporada 1 do OneTap", icon: "ribbon", category: "seasonal" as const, xpReward: 250, isSecret: false },
];

const games = [
  {
    id: generateId(),
    name: "Em Breve",
    description: "Novos jogos chegando. Fique atento!",
    minPlayers: 2,
    maxPlayers: 8,
    averageDuration: 180,
    isActive: true,
    isPlusExclusive: false,
    tags: ["coming-soon"],
  },
];

const now = new Date();
const seasonEnd = new Date(now);
seasonEnd.setDate(seasonEnd.getDate() + 90); // 90-day season

async function seed() {
  console.log("🌱 Seeding OneTap database...");

  // Season 1
  console.log("→ Creating Season 1...");
  await db.insert(seasonsTable).values({
    id: generateId(),
    name: "Temporada 1: Origens",
    number: 1,
    description: "A primeira temporada do OneTap. Escreva seu nome na história.",
    startDate: now,
    endDate: seasonEnd,
    isActive: true,
    themeColor: "#FF5F1F",
  }).onConflictDoNothing();

  // Achievements
  console.log("→ Creating achievements...");
  for (const ach of achievements) {
    await db.insert(achievementsTable).values({
      id: generateId(),
      ...ach,
      isSecret: ach.isSecret ?? false,
    }).onConflictDoNothing();
  }

  // Games placeholder
  console.log("→ Creating games...");
  for (const game of games) {
    await db.insert(gamesTable).values(game).onConflictDoNothing();
  }

  console.log("✅ Seed complete!");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
