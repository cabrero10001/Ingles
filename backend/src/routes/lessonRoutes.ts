import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { validateBody } from '../middlewares/validate.js';
import { z } from 'zod';
import { complete, today } from '../controllers/lessonController.js';

export const lessonRoutes = Router();

lessonRoutes.get('/lessons/today', requireAuth, today);
lessonRoutes.post(
  '/lessons/complete',
  requireAuth,
  validateBody(z.object({ userAnswer: z.string().min(1).max(5000) })),
  complete,
);
