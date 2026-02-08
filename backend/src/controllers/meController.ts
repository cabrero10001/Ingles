import type { Request, Response, NextFunction } from 'express';
import { ok } from '../lib/http.js';
import type { AuthedRequest } from '../middlewares/auth.js';
import { getMe } from '../services/userService.js';

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await getMe((req as AuthedRequest).userId);
    return res.json(ok({ user }));
  } catch (e) {
    next(e);
  }
}
