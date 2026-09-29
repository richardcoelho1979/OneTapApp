/**
 * Game Runner — executes game-engine hooks on behalf of the session module.
 *
 * The runner is the ONLY place where platform code touches a game engine.
 * Sessions module → runner → GameDefinition (via registry) → PlatformContext.
 */
import type { GameState, PlayerAction, PlayerResult } from '@workspace/game-sdk';
import { AppError } from '../shared/errors/AppError';
import { gameRegistry } from './registry';
import { buildPlatformContext } from './context';

interface SessionSnapshot {
  id: string;
  roomId: string;
  gameId: string;
  playerIds: string[];
  state: GameState;
  round: number;
}

export const gameRunner = {
  /** True if this gameId has a plugin installed (legacy games may not). */
  hasPlugin(gameId: string): boolean {
    return gameRegistry.get(gameId) !== undefined;
  },

  /** Initial JSONB state for a new session, or null when no plugin exists. */
  initialState(gameId: string, playerIds: string[]): GameState | null {
    const game = gameRegistry.get(gameId);
    if (!game) return null;
    return game.engine.initialState(playerIds);
  },

  /**
   * Process one player action. Returns the new state plus whether the game
   * finished (caller is responsible for persisting + finishing the session).
   */
  async processAction(
    session: SessionSnapshot,
    actorId: string,
    action: PlayerAction,
  ): Promise<{
    state: GameState;
    events: string[];
    finished: boolean;
    results: PlayerResult[] | null;
  }> {
    const game = gameRegistry.get(session.gameId);
    if (!game) throw AppError.notFound(`No game plugin installed for "${session.gameId}"`);

    let result;
    try {
      result = await game.engine.processAction(session.state, action, actorId);
    } catch (err) {
      // Engine validation errors (wrong turn, invalid card…) → 400 to the client.
      throw AppError.badRequest(err instanceof Error ? err.message : 'Invalid action');
    }

    const events = result.events ?? [];
    const finished = game.engine.isFinished(result.state);

    // Achievement hook (best-effort — a hook failure must not kill the move).
    if (game.hooks?.checkAchievements) {
      const ctx = buildPlatformContext({ ...session, state: result.state });
      try {
        const keys = await game.hooks.checkAchievements(
          ctx,
          result.state,
          { ...action, payload: { ...action.payload, __actorId: actorId } },
          events,
        );
        for (const key of keys) {
          await ctx.platform.awardAchievement(actorId, key);
        }
      } catch (err) {
        // Log-and-continue: achievements are additive, never blocking.
        console.error(`[game:${session.gameId}] checkAchievements failed`, err);
      }
    }

    return {
      state: result.state,
      events,
      finished,
      results: finished ? game.engine.computeResults(result.state) : null,
    };
  },

  /** XP for a result — game override or platform default table. */
  computeXP(gameId: string, result: PlayerResult, isSolo: boolean): number | null {
    const game = gameRegistry.get(gameId);
    if (!game?.engine.computeXP) return null;
    return game.engine.computeXP(result, isSolo);
  },

  /** Fire the onSessionStart hook (best-effort). */
  async onSessionStart(session: SessionSnapshot): Promise<void> {
    const game = gameRegistry.get(session.gameId);
    if (!game?.hooks?.onSessionStart) return;
    try {
      await game.hooks.onSessionStart(buildPlatformContext(session));
    } catch (err) {
      console.error(`[game:${session.gameId}] onSessionStart failed`, err);
    }
  },

  /** Fire the onSessionFinish hook (best-effort). */
  async onSessionFinish(session: SessionSnapshot, results: PlayerResult[]): Promise<void> {
    const game = gameRegistry.get(session.gameId);
    if (!game?.hooks?.onSessionFinish) return;
    try {
      await game.hooks.onSessionFinish(buildPlatformContext(session), results);
    } catch (err) {
      console.error(`[game:${session.gameId}] onSessionFinish failed`, err);
    }
  },
};
