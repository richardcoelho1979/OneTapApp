/**
 * Auth Repository — the ONLY layer that touches auth-related DB tables.
 * No business logic here. Returns raw Drizzle row types.
 * When auth is extracted to a microservice, this file becomes internal to that service.
 */
import { eq } from 'drizzle-orm';
import { db, usersTable, refreshTokensTable } from '@workspace/db';
import { generateId } from '../../lib/auth';

export const authRepository = {
  async findByEmail(email: string) {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);
    return user ?? null;
  },

  async findById(id: string) {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, id))
      .limit(1);
    return user ?? null;
  },

  async findByGoogleId(googleId: string) {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.googleId, googleId))
      .limit(1);
    return user ?? null;
  },

  async findByAppleId(appleId: string) {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.appleId, appleId))
      .limit(1);
    return user ?? null;
  },

  async emailExists(email: string): Promise<boolean> {
    const rows = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);
    return rows.length > 0;
  },

  async usernameExists(username: string): Promise<boolean> {
    const rows = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.username, username))
      .limit(1);
    return rows.length > 0;
  },

  async createUser(data: {
    username: string;
    email: string;
    passwordHash?: string;
    googleId?: string;
    appleId?: string;
    language?: string;
  }) {
    const [user] = await db
      .insert(usersTable)
      .values({ id: generateId(), ...data, language: (data.language ?? 'pt') as 'pt' | 'en' })
      .returning();
    return user!;
  },

  async linkGoogleId(userId: string, googleId: string) {
    await db
      .update(usersTable)
      .set({ googleId })
      .where(eq(usersTable.id, userId));
  },

  async linkAppleId(userId: string, appleId: string) {
    await db
      .update(usersTable)
      .set({ appleId })
      .where(eq(usersTable.id, userId));
  },

  async setOnlineStatus(userId: string, status: 'online' | 'offline' | 'away') {
    await db
      .update(usersTable)
      .set({ onlineStatus: status })
      .where(eq(usersTable.id, userId));
  },

  async createRefreshToken(data: {
    id: string;      // caller-supplied ID — must match the tokenId embedded in the JWT
    userId: string;
    token: string;
    expiresAt: Date;
  }) {
    await db.insert(refreshTokensTable).values(data);
    return data.id;
  },

  async findRefreshToken(tokenId: string) {
    const [token] = await db
      .select()
      .from(refreshTokensTable)
      .where(eq(refreshTokensTable.id, tokenId))
      .limit(1);
    return token ?? null;
  },

  async revokeRefreshToken(tokenId: string) {
    await db
      .update(refreshTokensTable)
      .set({ isRevoked: true })
      .where(eq(refreshTokensTable.id, tokenId));
  },

  async revokeAllUserTokens(userId: string) {
    await db
      .update(refreshTokensTable)
      .set({ isRevoked: true })
      .where(eq(refreshTokensTable.userId, userId));
  },
};
