import { AppError } from '../../shared/errors/AppError';
import { notificationsRepository } from './notifications.repository';

function fmt(n: Awaited<ReturnType<typeof notificationsRepository.create>>) {
  return {
    id: n.id,
    type: n.type as string,
    title: n.title,
    body: n.body,
    isRead: n.isRead,
    data: n.data ?? undefined,
    createdAt: n.createdAt.toISOString(),
  };
}

export const notificationsService = {
  async getForUser(userId: string, unreadOnly = false) {
    const rows = await notificationsRepository.getForUser(userId, unreadOnly);
    return rows.map(fmt);
  },

  async markRead(notificationId: string, userId: string) {
    const n = await notificationsRepository.markRead(notificationId, userId);
    if (!n) throw AppError.notFound('Notification not found');
    return fmt(n);
  },

  async markAllRead(userId: string) {
    await notificationsRepository.markAllRead(userId);
  },

  // Called by friends.service — cross-module service call (allowed in monolith)
  async create(data: {
    userId: string;
    type: 'friend_request' | 'friend_accepted' | 'room_invite' | 'achievement_unlocked' | 'season_start' | 'season_end' | 'system';
    title: string;
    body: string;
    data?: Record<string, unknown>;
  }) {
    const n = await notificationsRepository.create(data);
    return fmt(n);
  },
};
