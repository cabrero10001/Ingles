import bcrypt from 'bcrypt';
import { AppError } from '../errors/AppError.js';
import { sha256 } from '../lib/crypto.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../lib/jwt.js';
import { createRefreshToken, findValidRefreshToken, revokeRefreshToken } from '../repositories/refreshTokenRepo.js';
import { findUserByEmail } from '../repositories/userRepo.js';
import { prisma } from '../lib/prisma.js';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

function expiresAtFromJwt(token: string): Date {
  const decoded = jwt.decode(token) as { exp?: number } | null;
  if (!decoded?.exp) throw new AppError(500, 'TOKEN_ERROR', 'Refresh token missing exp');
  return new Date(decoded.exp * 1000);
}

export async function registerUser(params: { name: string; email: string; password: string }) {
  const existing = await findUserByEmail(params.email);
  if (existing) throw new AppError(409, 'EMAIL_TAKEN', 'Email already registered');

  const passwordHash = await bcrypt.hash(params.password, 12);
  const user = await prisma.user.create({
    data: { name: params.name, email: params.email, passwordHash },
    select: { id: true, name: true, email: true, currentGoal: true, currentDay: true, streak: true },
  });

  const accessToken = signAccessToken(user.id);
  const refreshToken = signRefreshToken(user.id);
  await createRefreshToken({
    userId: user.id,
    tokenHash: sha256(refreshToken),
    expiresAt: expiresAtFromJwt(refreshToken),
  });

  return { user, accessToken, refreshToken };
}

export async function loginUser(params: { email: string; password: string }) {
  const userRow = await prisma.user.findUnique({ where: { email: params.email } });
  if (!userRow) throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');

  const ok = await bcrypt.compare(params.password, userRow.passwordHash);
  if (!ok) throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');

  const user = {
    id: userRow.id,
    name: userRow.name,
    email: userRow.email,
    currentGoal: userRow.currentGoal,
    currentDay: userRow.currentDay,
    streak: userRow.streak,
  };

  const accessToken = signAccessToken(user.id);
  const refreshToken = signRefreshToken(user.id);

  await createRefreshToken({
    userId: user.id,
    tokenHash: sha256(refreshToken),
    expiresAt: expiresAtFromJwt(refreshToken),
  });

  return { user, accessToken, refreshToken };
}

export async function refreshSession(refreshToken: string) {
  // Verify signature/exp first.
  let payload: { sub: string };
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new AppError(401, 'INVALID_REFRESH', 'Invalid refresh token');
  }
  const tokenHash = sha256(refreshToken);
  const stored = await findValidRefreshToken(tokenHash);
  if (!stored) throw new AppError(401, 'INVALID_REFRESH', 'Invalid refresh token');

  // Rotate refresh token.
  await revokeRefreshToken(stored.id);
  const newRefresh = signRefreshToken(payload.sub);
  await createRefreshToken({
    userId: payload.sub,
    tokenHash: sha256(newRefresh),
    expiresAt: expiresAtFromJwt(newRefresh),
  });

  const accessToken = signAccessToken(payload.sub);
  return { accessToken, refreshToken: newRefresh };
}

export async function logout(refreshToken: string | null) {
  if (!refreshToken) return;
  try {
    // If token is malformed/expired, just clear cookie client-side.
    verifyRefreshToken(refreshToken);
  } catch {
    return;
  }
  const stored = await findValidRefreshToken(sha256(refreshToken));
  if (stored) await revokeRefreshToken(stored.id);
}

export function refreshCookieName() {
  return env.REFRESH_COOKIE_NAME;
}
