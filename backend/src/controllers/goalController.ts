import type { Request, Response, NextFunction } from 'express';
import { ok } from '../lib/http.js';
import type { AuthedRequest } from '../middlewares/auth.js';
import type { Goal } from '@prisma/client';
import { setUserGoal } from '../services/goalService.js';

export async function setGoal(req: Request, res: Response, next: NextFunction) {
  try {
    const { goal } = req.body as { goal: Goal };
    const out = await setUserGoal((req as AuthedRequest).userId, goal);
    return res.json(ok({ progress: out }));
  } catch (e) {
    next(e);
  }
}
