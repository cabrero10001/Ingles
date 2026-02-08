import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middlewares/auth.js';
import { validateBody } from '../middlewares/validate.js';
import { challengeStats, submitChallenge, todayChallenge } from '../controllers/challengeController.js';

export const challengeRoutes = Router();

challengeRoutes.get('/challenges/today', requireAuth, todayChallenge);
challengeRoutes.get('/challenges/stats', requireAuth, challengeStats);
challengeRoutes.post(
  '/challenges/answer',
  requireAuth,
  validateBody(
    z.object({
      challengeId: z.string().min(1),
      selectedIndex: z.number().int().min(0),
    }),
  ),
  submitChallenge,
);
