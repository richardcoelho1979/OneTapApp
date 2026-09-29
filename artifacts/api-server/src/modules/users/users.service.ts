import { AppError } from '../../shared/errors/AppError';
import { buildUserProfile } from '../../shared/mappers/user.mapper';
import { usersRepository } from './users.repository';

export const usersService = {
  async getMe(userId: string) {
    const user = await usersRepository.findById(userId);
    if (!user) throw AppError.unauthorized('User not found');
    return buildUserProfile(user);
  },

  async updateMe(userId: string, data: {
    username?: string;
    bio?: string;
    avatarUrl?: string;
    language?: string;
    country?: string;
  }) {
    const updates: Record<string, unknown> = {};
    if (data.username !== undefined) updates.username = data.username;
    if (data.bio !== undefined) updates.bio = data.bio;
    if (data.avatarUrl !== undefined) updates.avatarUrl = data.avatarUrl;
    if (data.language !== undefined) updates.language = data.language;
    if (data.country !== undefined) updates.country = data.country;

    const user = await usersRepository.update(userId, updates);
    if (!user) throw AppError.notFound('User not found');
    return buildUserProfile(user);
  },

  async searchUsers(query: string) {
    if (query.length < 2) throw AppError.badRequest('Query must be at least 2 characters');
    const users = await usersRepository.searchByUsername(query);
    return users.map(buildUserProfile);
  },

  async getUserById(userId: string) {
    const user = await usersRepository.findById(userId);
    if (!user) throw AppError.notFound('User not found');
    return buildUserProfile(user);
  },

  async getUserAchievements(userId: string) {
    const rows = await usersRepository.getUserAchievements(userId);
    return rows.map((r) => ({
      achievement: {
        id: r.achievement.id,
        key: r.achievement.key,
        title: r.achievement.title,
        description: r.achievement.description,
        icon: r.achievement.icon,
        category: r.achievement.category,
        xpReward: r.achievement.xpReward,
        isSecret: r.achievement.isSecret,
      },
      unlockedAt: r.unlockedAt.toISOString(),
    }));
  },

  // Called by sessions.service — cross-module service call (allowed)
  async addXP(userId: string, xpGain: number, isWinner: boolean) {
    return usersRepository.addXP(userId, xpGain, isWinner);
  },
};
