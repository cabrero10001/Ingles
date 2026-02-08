import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors/AppError.js';
import { verifyAccessToken } from '../lib/jwt.js';

export type AuthedRequest = Request & { userId: string };

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : null;
  if (!token) return next(new AppError(401, 'UNAUTHORIZED', 'Missing access token'));

  try {
    const payload = verifyAccessToken(token);
    (req as AuthedRequest).userId = payload.sub;
    next();
  } catch {
    next(new AppError(401, 'UNAUTHORIZED', 'Invalid or expired access token'));
  }
}
