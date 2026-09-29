/**
 * Auth Service — business logic for authentication.
 * Calls authRepository for data access. Returns clean domain types.
 * No HTTP concerns here (no request/reply objects).
 */
import {
  hashPassword,
  verifyPassword,
  generateAccessToken,
  generateRefreshToken,
  getRefreshTokenExpiry,
  verifyRefreshToken,
  generateId,
} from '../../lib/auth';
import { AppError } from '../../shared/errors/AppError';
import { buildUserProfile } from '../../shared/mappers/user.mapper';
import { authRepository } from './auth.repository';
import { createRemoteJWKSet, jwtVerify } from 'jose';

// ─── JWKS key sets (cached in memory — jose refreshes automatically) ──────────

const googleJWKS = createRemoteJWKSet(
  new URL('https://www.googleapis.com/oauth2/v3/certs'),
);

const appleJWKS = createRemoteJWKSet(
  new URL('https://appleid.apple.com/auth/keys'),
);

// ─── OAuth ID token verifiers ─────────────────────────────────────────────────

/**
 * Verifies a Google ID token cryptographically against Google's public JWKS.
 *
 * Guarantees:
 *   - Signature is valid (forged tokens are rejected)
 *   - Issuer is `accounts.google.com` or `https://accounts.google.com`
 *   - Token is not expired
 *   - Audience matches GOOGLE_CLIENT_ID env var (when configured)
 *
 * Returns the verified payload.
 */
async function verifyGoogleIdToken(token: string) {
  const audience = process.env.GOOGLE_CLIENT_ID;
  try {
    const { payload } = await jwtVerify(token, googleJWKS, {
      issuer: ['accounts.google.com', 'https://accounts.google.com'],
      ...(audience ? { audience } : {}),
    });
    return payload as {
      sub: string;
      email: string;
      name?: string;
      email_verified?: boolean;
    };
  } catch (err) {
    throw AppError.unauthorized(
      'Google authentication failed: invalid or expired token',
    );
  }
}

/**
 * Verifies an Apple ID token cryptographically against Apple's public JWKS.
 *
 * Guarantees:
 *   - Signature is valid (forged tokens are rejected)
 *   - Issuer is `https://appleid.apple.com`
 *   - Token is not expired
 *   - Audience matches APPLE_CLIENT_ID env var (when configured)
 *
 * Returns the verified payload.
 */
async function verifyAppleIdToken(token: string) {
  const audience = process.env.APPLE_CLIENT_ID;
  try {
    const { payload } = await jwtVerify(token, appleJWKS, {
      issuer: 'https://appleid.apple.com',
      ...(audience ? { audience } : {}),
    });
    return payload as {
      sub: string;
      email?: string;
      email_verified?: boolean | string;
    };
  } catch (err) {
    throw AppError.unauthorized(
      'Apple authentication failed: invalid or expired token',
    );
  }
}

// ─── Token pair helper ────────────────────────────────────────────────────────

async function issueTokens(userId: string) {
  const accessToken = generateAccessToken(userId);
  // tokenId is generated here and embedded in the JWT.
  // The SAME id is passed to createRefreshToken so that findRefreshToken(tokenId)
  // can locate the record by its primary key during refresh.
  const tokenId = generateId();
  const refreshToken = generateRefreshToken(userId, tokenId);
  await authRepository.createRefreshToken({
    id: tokenId,
    userId,
    token: refreshToken,
    expiresAt: getRefreshTokenExpiry(),
  });
  return { accessToken, refreshToken };
}

// ─── Public service methods ───────────────────────────────────────────────────

export const authService = {
  async register(data: {
    username: string;
    email: string;
    password: string;
    language?: string;
  }) {
    if (await authRepository.emailExists(data.email)) {
      throw AppError.conflict('Email already in use');
    }
    if (await authRepository.usernameExists(data.username)) {
      throw AppError.conflict('Username already taken');
    }

    const passwordHash = await hashPassword(data.password);
    const user = await authRepository.createUser({
      username: data.username,
      email: data.email,
      passwordHash,
      language: data.language,
    });

    const tokens = await issueTokens(user.id);
    return { ...tokens, user: buildUserProfile(user) };
  },

  async login(email: string, password: string) {
    const user = await authRepository.findByEmail(email);
    if (!user || !user.passwordHash) {
      throw AppError.unauthorized('Invalid credentials');
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) throw AppError.unauthorized('Invalid credentials');

    await authRepository.setOnlineStatus(user.id, 'online');
    const tokens = await issueTokens(user.id);
    return { ...tokens, user: buildUserProfile({ ...user, onlineStatus: 'online' }) };
  },

  async refresh(refreshToken: string) {
    const payload = verifyRefreshToken(refreshToken);
    if (!payload) throw AppError.unauthorized('Invalid refresh token');

    const stored = await authRepository.findRefreshToken(payload.tokenId);
    if (!stored || stored.isRevoked || stored.token !== refreshToken) {
      throw AppError.unauthorized('Refresh token revoked or invalid');
    }
    if (stored.expiresAt < new Date()) {
      throw AppError.unauthorized('Refresh token expired');
    }

    await authRepository.revokeRefreshToken(stored.id);

    const user = await authRepository.findById(payload.userId);
    if (!user) throw AppError.unauthorized('User not found');

    const tokens = await issueTokens(user.id);
    return { ...tokens, user: buildUserProfile(user) };
  },

  async logout(userId: string) {
    await authRepository.revokeAllUserTokens(userId);
    await authRepository.setOnlineStatus(userId, 'offline');
  },

  async loginWithGoogle(token: string) {
    // Cryptographically verify the ID token against Google's public JWKS.
    // This replaces the previous insecure Base64 decode that could be forged.
    const payload = await verifyGoogleIdToken(token);

    const googleId = payload.sub;
    const email    = payload.email ?? `${googleId}@google-noemail.com`;
    const name     = payload.name  ?? email.split('@')[0] ?? 'User';

    let user = await authRepository.findByGoogleId(googleId);
    if (!user) {
      const byEmail = await authRepository.findByEmail(email);
      if (byEmail) {
        user = byEmail;
        await authRepository.linkGoogleId(byEmail.id, googleId);
      } else {
        const username =
          `${name.replace(/\s+/g, '').toLowerCase().slice(0, 20)}${Math.floor(Math.random() * 9999)}`;
        user = await authRepository.createUser({ username, email, googleId });
      }
    }

    await authRepository.setOnlineStatus(user.id, 'online');
    const tokens = await issueTokens(user.id);
    return { ...tokens, user: buildUserProfile({ ...user, onlineStatus: 'online' }) };
  },

  async loginWithApple(token: string) {
    // Cryptographically verify the ID token against Apple's public JWKS.
    // This replaces the previous insecure Base64 decode that could be forged.
    const payload = await verifyAppleIdToken(token);

    const appleId = payload.sub;
    // Apple may omit email after first sign-in; use a stable derived address.
    const email = payload.email ?? `${appleId.slice(0, 16)}@apple-noemail.com`;

    let user = await authRepository.findByAppleId(appleId);
    if (!user) {
      const byEmail = await authRepository.findByEmail(email);
      if (byEmail) {
        user = byEmail;
        await authRepository.linkAppleId(byEmail.id, appleId);
      } else {
        const username = `user${Math.floor(Math.random() * 99999)}`;
        user = await authRepository.createUser({ username, email, appleId });
      }
    }

    await authRepository.setOnlineStatus(user.id, 'online');
    const tokens = await issueTokens(user.id);
    return { ...tokens, user: buildUserProfile({ ...user, onlineStatus: 'online' }) };
  },
};
