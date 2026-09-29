/**
 * Game Registry — the heart of the plugin system.
 *
 * At boot, seedGames() upserts every registered game and its achievements into
 * the database. Nothing else on the platform knows game internals: rooms,
 * ranking, championships, seasons, subscriptions and profile all key off the
 * gamesTable row this registry maintains.
 *
 * TO INSTALL A NEW GAME: add one import + one array entry. That's it.
 */
import { eq } from 'drizzle-orm';
import { db, gamesTable, achievementsTable } from '@workspace/db';
import type { GameDefinition } from '@workspace/game-sdk';
import { randomUUID } from 'node:crypto';

import { memoryGame } from './memory/index';

// ─── Installed games ─────────────────────────────────────────────────────────
const GAMES: GameDefinition[] = [
  memoryGame,
  // ← add new games here (single line per game)
];

// ─── Lookup ──────────────────────────────────────────────────────────────────

const bySlug = new Map<string, GameDefinition>(GAMES.map((g) => [g.slug, g]));

export const gameRegistry = {
  all(): GameDefinition[] {
    return GAMES;
  },

  get(slug: string): GameDefinition | undefined {
    return bySlug.get(slug);
  },

  /** Full achievement key in the DB: "<slug>:<key>". */
  achievementKey(slug: string, scopedKey: string): string {
    return `${slug}:${scopedKey}`;
  },
};

// ─── Boot-time validation ────────────────────────────────────────────────────

function validate(game: GameDefinition): void {
  if (!/^[a-z0-9-]+$/.test(game.slug)) {
    throw new Error(`Game slug "${game.slug}" must be lowercase alphanumeric/hyphen`);
  }
  if (game.meta.minPlayers < 1 || game.meta.maxPlayers < game.meta.minPlayers) {
    throw new Error(`Game "${game.slug}": invalid player range`);
  }
  const seen = new Set<string>();
  for (const a of game.achievements) {
    if (seen.has(a.key)) throw new Error(`Game "${game.slug}": duplicate achievement "${a.key}"`);
    seen.add(a.key);
  }
}

// ─── Boot-time seeding ───────────────────────────────────────────────────────

/**
 * Idempotent upsert of games + achievements. Called once at server boot.
 * Uses pt-BR as the canonical DB language (platform default); clients receive
 * per-locale strings from the game's translations via the API.
 */
export async function seedGames(log: (msg: string) => void = () => {}): Promise<void> {
  for (const game of GAMES) {
    validate(game);

    // ── Game row (id = slug, stable forever) ─────────────────────────────────
    const values = {
      id: game.slug,
      name: game.meta.name['pt-BR'],
      description: game.meta.description['pt-BR'],
      minPlayers: game.meta.minPlayers,
      maxPlayers: game.meta.maxPlayers,
      averageDuration: game.meta.averageDuration,
      iconUrl: game.meta.iconUrl ?? null,
      isActive: true,
      isPlusExclusive: game.meta.isPlusExclusive,
      tags: game.meta.tags,
    };
    await db
      .insert(gamesTable)
      .values(values)
      .onConflictDoUpdate({ target: gamesTable.id, set: values });

    // ── Achievements ─────────────────────────────────────────────────────────
    for (const a of game.achievements) {
      const key = gameRegistry.achievementKey(game.slug, a.key);
      const [existing] = await db
        .select({ id: achievementsTable.id })
        .from(achievementsTable)
        .where(eq(achievementsTable.key, key))
        .limit(1);

      const row = {
        key,
        title: a.title['pt-BR'],
        description: a.description['pt-BR'],
        icon: a.icon,
        category: a.category,
        xpReward: a.xpReward,
        isSecret: a.isSecret ?? false,
      };

      if (existing) {
        await db.update(achievementsTable).set(row).where(eq(achievementsTable.id, existing.id));
      } else {
        await db.insert(achievementsTable).values({ id: randomUUID(), ...row });
      }
    }

    log(`game plugin loaded: ${game.slug}@${game.version} (${game.achievements.length} achievements)`);
  }
}
