import { rankingsRepository } from './rankings.repository';

function fmt(
  user: Awaited<ReturnType<typeof rankingsRepository.getGlobal>>[number],
  rank: number,
) {
  return {
    rank,
    userId:      user.id,
    username:    user.username,
    avatarUrl:   user.avatarUrl ?? null,
    xp:          user.xp,
    level:       user.level,
    gamesPlayed: user.gamesPlayed,
    wins:        user.wins,
    isPlusMember: user.isPlusMember,
  };
}

export const rankingsService = {
  async getGlobal(limit = 50) {
    const users = await rankingsRepository.getGlobal(Math.min(limit, 100));
    return users.map((u, i) => fmt(u, i + 1));
  },

  async getFriends(userId: string) {
    // Single SQL query — no JS filtering, no 500-user cap.
    // Returns the user + all their friends ranked by XP descending.
    const users = await rankingsRepository.getFriendsRanking(userId);
    return users.map((u, i) => fmt(u, i + 1));
  },
};
