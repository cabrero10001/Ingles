import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { validateBody } from '../middlewares/validate.js';
import { z } from 'zod';
import { Goal } from '@prisma/client';
import { setGoal } from '../controllers/goalController.js';

export const goalRoutes = Router();

goalRoutes.post(
  '/goal',
  requireAuth,
  validateBody(z.object({ goal: z.nativeEnum(Goal) })),
  setGoal,
);
