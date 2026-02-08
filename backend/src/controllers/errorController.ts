import type { Request, Response, NextFunction } from 'express';
import { ok } from '../lib/http.js';
import type { AuthedRequest } from '../middlewares/auth.js';
import { errorHistoryByLesson, topErrors } from '../services/lessonService.js';

export async function top(req: Request, res: Response, next: NextFunction) {
  try {
    const errors = await topErrors((req as AuthedRequest).userId);
    return res.json(ok({ errors }));
  } catch (e) {
    next(e);
  }
}

export async function history(req: Request, res: Response, next: NextFunction) {
  try {
    const lessons = await errorHistoryByLesson((req as AuthedRequest).userId);
    return res.json(ok({ lessons }));
  } catch (e) {
    next(e);
  }
}
