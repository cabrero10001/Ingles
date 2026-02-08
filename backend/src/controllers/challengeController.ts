import type { NextFunction, Request, Response } from 'express';
import { ok } from '../lib/http.js';
import type { AuthedRequest } from '../middlewares/auth.js';
import { answerTodayChallenge, getTodayChallenge, getWeeklyChallengeStats } from '../services/challengeService.js';

export async function todayChallenge(req: Request, res: Response, next: NextFunction) {
  try {
    const challenge = await getTodayChallenge((req as AuthedRequest).userId);
    return res.json(ok({ challenge }));
  } catch (e) {
    next(e);
  }
}

export async function submitChallenge(req: Request, res: Response, next: NextFunction) {
  try {
    const { challengeId, selectedIndex } = req.body as { challengeId: string; selectedIndex: number };
    const result = await answerTodayChallenge((req as AuthedRequest).userId, { challengeId, selectedIndex });
    return res.json(ok({ result }));
  } catch (e) {
    next(e);
  }
}

export async function challengeStats(req: Request, res: Response, next: NextFunction) {
  try {
    const stats = await getWeeklyChallengeStats((req as AuthedRequest).userId);
    return res.json(ok({ stats }));
  } catch (e) {
    next(e);
  }
}
