import { subscriptionsRepository } from './subscriptions.repository';

export const subscriptionsService = {
  async getMyStatus(userId: string) {
    const s = await subscriptionsRepository.findByUser(userId);
    if (!s || !s.isActive || s.expiresAt < new Date()) {
      return { isPlusMember: false, plan: null, expiresAt: null, startedAt: null };
    }
    return {
      isPlusMember: true,
      plan: s.plan,
      expiresAt: s.expiresAt.toISOString(),
      startedAt: s.startedAt.toISOString(),
    };
  },
};
