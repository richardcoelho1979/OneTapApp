/**
 * @workspace/game-sdk
 *
 * The contract every OneTap game must implement.
 * Zero runtime dependencies — pure TypeScript types.
 *
 * HOW TO ADD A NEW GAME
 * ─────────────────────
 * 1. Create  artifacts/api-server/src/games/<slug>/
 *      index.ts         → exports a GameDefinition
 *      engine.ts        → pure state-machine (no I/O, no platform imports)
 *      achievements.ts  → AchievementDef[]
 *      i18n.ts          → translations per locale
 * 2. Register it in artifacts/api-server/src/games/registry.ts (one import line).
 * 3. Restart the server → game + achievements are seeded in the DB, fully live.
 *
 * The platform automatically provides: login, friends, rooms, ranking,
 * championships, achievements, seasons, OneTap Plus, profile, i18n and
 * notifications. Game engines never import from platform modules — everything
 * arrives via the injected PlatformContext.
 */

// ─── Locale ──────────────────────────────────────────────────────────────────

export type Locale = 'pt-BR' | 'en' | 'es';

export type LocaleMap<T = string> = Record<Locale, T>;

// ─── Achievements ─────────────────────────────────────────────────────────────

export type AchievementCategory =
  | 'social'
  | 'competitive'
  | 'explorer'
  | 'milestone'
  | 'seasonal';

export interface AchievementDef {
  /** Scoped key, e.g. "first_pair". The registry prefixes it: "memory:first_pair". */
  key: string;
  title: LocaleMap;
  description: LocaleMap;
  /** Emoji or icon name shown in the UI. */
  icon: string;
  category: AchievementCategory;
  xpReward: number;
  isSecret?: boolean;
}

// ─── Session / game state ────────────────────────────────────────────────────

/** Opaque bag owned by the game engine. Stored as JSONB in game_sessions.state. */
export type GameState = Record<string, unknown>;

/** A player action forwarded from POST /sessions/:id/action. */
export interface PlayerAction {
  type: string;
  payload: Record<string, unknown>;
}

export interface PlayerResult {
  userId: string;
  score: number;
  finalRank: number;
}

export interface ActionResult {
  state: GameState;
  /** Semantic events (e.g. "pair_matched") the platform and client may react to. */
  events?: string[];
}

// ─── Platform context ────────────────────────────────────────────────────────

export type NotificationType =
  | 'achievement_unlocked'
  | 'system'
  | 'room_invite'
  | 'friend_request'
  | 'friend_accepted'
  | 'season_start'
  | 'season_end';

export interface SeasonInfo {
  id: string;
  name: string;
  number: number;
  isActive: boolean;
  endDate: string;
}

export interface SubscriptionInfo {
  isPlusMember: boolean;
  plan: string | null;
}

/**
 * Services injected into every game hook.
 * Games MUST use this interface — never import platform modules directly.
 */
export interface PlatformContext {
  session: {
    id: string;
    roomId: string;
    gameId: string;
    isSolo: boolean;
    playerIds: string[];
    state: GameState;
    round: number;
  };
  platform: {
    /** Send an in-app notification. */
    notify(
      userId: string,
      type: NotificationType,
      title: string,
      body: string,
    ): Promise<void>;
    /**
     * Unlock an achievement for a player. Pass the scoped key (e.g. "first_pair")
     * — the platform prepends the game slug. Duplicate awards are no-ops.
     */
    awardAchievement(userId: string, scopedKey: string): Promise<void>;
    /** Returns userId[] of the given user's friends. */
    getFriends(userId: string): Promise<string[]>;
    getSeason(): Promise<SeasonInfo | null>;
    getSubscription(userId: string): Promise<SubscriptionInfo>;
  };
}

// ─── Game definition ─────────────────────────────────────────────────────────

export interface GameDefinition {
  /**
   * Stable, URL-safe identifier — also the primary key in gamesTable.
   * Never change it after the game ships; sessions reference it forever.
   */
  slug: string;

  /** SemVer for diagnostics; does not affect DB records. */
  version: string;

  /** Metadata synced to gamesTable at boot (upsert). */
  meta: {
    name: LocaleMap;
    description: LocaleMap;
    minPlayers: number;
    maxPlayers: number;
    isPlusExclusive: boolean;
    /** Typical duration in seconds. */
    averageDuration: number;
    tags: string[];
    iconUrl?: string;
  };

  /** Seeded into achievementsTable at boot. Keys become "slug:key". */
  achievements: AchievementDef[];

  /**
   * Game i18n strings, exposed to clients via GET /games (translations field).
   * Convention for the app: t('games.<slug>.<key>').
   */
  translations: Record<Locale, Record<string, string>>;

  engine: {
    /** Called once at session start. Must return serialisable state (JSONB). */
    initialState(playerIds: string[]): GameState;

    /**
     * Pure function: current state + one player action → new state.
     * Must NOT perform I/O. Throw Error for invalid moves (message goes to client).
     */
    processAction(
      state: GameState,
      action: PlayerAction,
      actorId: string,
    ): ActionResult | Promise<ActionResult>;

    /** True when the game is over → platform auto-finishes the session. */
    isFinished(state: GameState): boolean;

    /** Derives the final leaderboard from terminal state. */
    computeResults(state: GameState): PlayerResult[];

    /**
     * Optional XP override. Default platform table:
     * solo 25 XP · multiplayer 1st→100, 2nd→60, 3rd→40, rest→20.
     */
    computeXP?(result: PlayerResult, isSolo: boolean): number;
  };

  hooks?: {
    /** After the session row is created. */
    onSessionStart?(ctx: PlatformContext): Promise<void>;

    /** After XP is distributed on finish. */
    onSessionFinish?(
      ctx: PlatformContext,
      results: PlayerResult[],
    ): Promise<void>;

    /**
     * After every action. Return scoped achievement keys to award.
     * The platform deduplicates automatically.
     */
    checkAchievements?(
      ctx: PlatformContext,
      state: GameState,
      action: PlayerAction,
      events: string[],
    ): Promise<string[]>;
  };
}
