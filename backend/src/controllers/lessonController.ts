import type { Request, Response, NextFunction } from 'express';
import { ok } from '../lib/http.js';
import type { AuthedRequest } from '../middlewares/auth.js';
import { completeLesson, getTodayLesson } from '../services/lessonService.js';

export async function today(req: Request, res: Response, next: NextFunction) {
  try {
    const lesson = await getTodayLesson((req as AuthedRequest).userId);
    return res.json(ok({ lesson }));
  } catch (e) {
    next(e);
  }
}

export async function complete(req: Request, res: Response, next: NextFunction) {
  try {
    const { userAnswer } = req.body as { userAnswer: string };
    const out = await completeLesson((req as AuthedRequest).userId, userAnswer);
    return res.json(ok(out));
  } catch (e) {
    next(e);
  }
}
