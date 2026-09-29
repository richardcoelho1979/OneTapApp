/**
 * PlatformContext factory — the dependency-injection bridge between the
 * platform and game plugins. Games receive this object and never import
 * platform modules directly, which keeps them portable and testable.
 */
import { eq } from 'drizzle-orm';
import { db, achievementsTable, userAchievementsTable } from '@workspace/db';
import type { PlatformContext, NotificationType, GameState } from '@workspace/game-sdk';
import { randomUUID } from 'node:crypto';
import { notificationsService } from '../modules/notifications/notifications.service';
import { friendsService } from '../modules/friends/friends.service';
import { seasonsService } from '../modules/seasons/seasons.service';
import { subscriptionsService } from '../modules/subscriptions/subscriptions.service';
import { usersService } from '../modules/users/users.service';
import { gameRegistry } from './registry';

interface SessionInfo {
  id: string;
  roomId: string;
  gameId: string;
  playerIds: string[];
  state: GameState;
  round: number;
}

export function buildPlatformContext(session: SessionInfo): PlatformContext {
  const isSolo = session.playerIds.length === 1;

  return {
    session: {
      id: session.id,
      roomId: session.roomId,
      gameId: session.gameId,
      isSolo,
      playerIds: session.playerIds,
      state: session.state,
      round: session.round,
    },

    platform: {
      async notify(userId: string, type: NotificationType, title: string, body: string) {
        // Games may only notify their own participants.
        if (!session.playerIds.includes(userId)) return;
        await notificationsService.create({ userId, type, title, body });
      },

      async awardAchievement(userId: string, scopedKey: string) {
        if (!session.playerIds.includes(userId)) return;

        const key = gameRegistry.achievementKey(session.gameId, scopedKey);
        const [achievement] = await db
          .select()
          .from(achievementsTable)
          .where(eq(achievementsTable.key, key))
          .limit(1);
        if (!achievement) return; // unknown key → silent no-op (defensive)

        // Dedup: DB unique constraint on (userId, achievementId) is the
        // authority — concurrent awards resolve to a single row, and XP is
        // only granted when this call actually inserted it.
        const inserted = await db
          .insert(userAchievementsTable)
          .values({ id: randomUUID(), userId, achievementId: achievement.id })
          .onConflictDoNothing()
          .returning({ id: userAchievementsTable.id });
        if (inserted.length === 0) return;

        if (achievement.xpReward > 0) {
          await usersService.addXP(userId, achievement.xpReward, false);
        }

        await notificationsService.create({
          userId,
          type: 'achievement_unlocked',
          title: achievement.title,
          body: achievement.description,
          data: { achievementKey: key },
        });
      },

      async getFriends(userId: string) {
        const friends = await friendsService.getFriends(userId);
        return friends.map((f) => f.friendId);
      },

      async getSeason() {
        try {
          const s = await seasonsService.getCurrent();
          return {
            id: s.id,
            name: s.name,
            number: s.number,
            isActive: s.isActive,
            endDate: s.endDate,
          };
        } catch {
          return null; // no active season
        }
      },

      async getSubscription(userId: string) {
        const s = await subscriptionsService.getMyStatus(userId);
        return { isPlusMember: s.isPlusMember, plan: s.plan };
      },
    },
  };
}
