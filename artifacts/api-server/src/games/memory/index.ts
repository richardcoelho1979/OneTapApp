/**
 * Memory Game — the reference implementation of the OneTap game contract.
 *
 * Everything a game needs lives in this folder:
 *   engine.ts        → pure game logic
 *   achievements.ts  → achievements seeded at boot
 *   i18n.ts          → translations served to clients
 *   index.ts         → the GameDefinition wiring it all together
 */
import type { GameDefinition, PlatformContext, PlayerAction, GameState } from '@workspace/game-sdk';
import * as engine from './engine';
import type { MemoryGameState } from './engine';
import { memoryAchievements } from './achievements';
import { memoryTranslations } from './i18n';

export const memoryGame: GameDefinition = {
  slug: 'memory',
  version: '1.0.0',

  meta: {
    name: {
      'pt-BR': memoryTranslations['pt-BR']['name']!,
      en: memoryTranslations.en['name']!,
      es: memoryTranslations.es['name']!,
    },
    description: {
      'pt-BR': memoryTranslations['pt-BR']['description']!,
      en: memoryTranslations.en['description']!,
      es: memoryTranslations.es['description']!,
    },
    minPlayers: 1,
    maxPlayers: 4,
    isPlusExclusive: false,
    averageDuration: 180,
    tags: ['casual', 'memory', 'family'],
  },

  achievements: memoryAchievements,
  translations: memoryTranslations,

  engine: {
    initialState: (playerIds) => engine.initialState(playerIds),
    processAction: (state, action, actorId) =>
      engine.processAction(state, action, actorId),
    isFinished: (state) => engine.isFinished(state),
    computeResults: (state) => engine.computeResults(state),
  },

  hooks: {
    async checkAchievements(
      ctx: PlatformContext,
      state: GameState,
      action: PlayerAction,
      events: string[],
    ): Promise<string[]> {
      const s = state as MemoryGameState;
      const keys: string[] = [];
      const actorId = String(action.payload['__actorId'] ?? '');

      // First pair matched by this player → "first_pair"
      if (events.includes('pair_matched') && actorId) {
        keys.push('first_pair');
      }

      if (events.includes('game_finished')) {
        const elapsedSec = ((s.finishedAt ?? 0) - s.startedAt) / 1000;
        for (const playerId of s.playerOrder) {
          // Perfect game: player found ≥1 pair and made zero mistakes.
          if ((s.scores[playerId] ?? 0) > 0 && (s.mistakes[playerId] ?? 1) === 0) {
            await ctx.platform.awardAchievement(playerId, 'perfect_memory');
          }
        }
        // Speed run: solo game under 60 seconds.
        if (ctx.session.isSolo && elapsedSec > 0 && elapsedSec < 60) {
          await ctx.platform.awardAchievement(ctx.session.playerIds[0]!, 'speed_memory');
        }
      }

      return keys;
    },
  },
};
