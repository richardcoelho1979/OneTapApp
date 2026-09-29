import type { usersTable } from '@workspace/db';

/**
 * Converts a raw DB row into the public-facing UserProfile shape.
 * Lives in shared/mappers so any module can import it without creating
 * circular dependencies. When users is extracted to a microservice, this
 * mapper ships with the users SDK.
 */
export function buildUserProfile(user: typeof usersTable.$inferSelect) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    avatarUrl: user.avatarUrl ?? null,
    bio: user.bio ?? null,
    level: user.level,
    xp: user.xp,
    country: user.country ?? null,
    language: user.language,
    isPlusMember: user.isPlusMember,
    onlineStatus: user.onlineStatus,
    gamesPlayed: user.gamesPlayed,
    wins: user.wins,
    createdAt: user.createdAt.toISOString(),
  };
}

export type UserProfile = ReturnType<typeof buildUserProfile>;
