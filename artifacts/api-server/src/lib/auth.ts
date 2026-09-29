import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
const JWT_SECRET = process.env.SESSION_SECRET;
if (!JWT_SECRET) {
  throw new Error("SESSION_SECRET environment variable is required");
}

const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY = "7d";
const BCRYPT_ROUNDS = 12;

export function generateId(): string {
  return crypto.randomUUID();
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export interface AccessTokenPayload {
  userId: string;
  type: "access";
}

export interface RefreshTokenPayload {
  userId: string;
  type: "refresh";
  tokenId: string;
}

export function generateAccessToken(userId: string): string {
  return jwt.sign({ userId, type: "access" } satisfies AccessTokenPayload, JWT_SECRET!, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });
}

export function generateRefreshToken(userId: string, tokenId: string): string {
  return jwt.sign({ userId, type: "refresh", tokenId } satisfies RefreshTokenPayload, JWT_SECRET!, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
  });
}

export function getRefreshTokenExpiry(): Date {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date;
}

export function verifyAccessToken(token: string): AccessTokenPayload | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET!) as AccessTokenPayload;
    if (payload.type !== "access") return null;
    return payload;
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token: string): RefreshTokenPayload | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET!) as RefreshTokenPayload;
    if (payload.type !== "refresh") return null;
    return payload;
  } catch {
    return null;
  }
}

export function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

