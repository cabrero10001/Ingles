import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export type AccessTokenPayload = {
  sub: string;
};

export function signAccessToken(userId: string): string {
  const payload: AccessTokenPayload = { sub: userId };
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: env.JWT_ACCESS_TTL as any });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
}

export function signRefreshToken(userId: string): string {
  const payload: AccessTokenPayload = { sub: userId };
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_TTL as any });
}

export function verifyRefreshToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as AccessTokenPayload;
}
