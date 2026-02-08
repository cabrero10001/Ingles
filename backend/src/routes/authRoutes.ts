import { Router } from 'express';
import { validateBody } from '../middlewares/validate.js';
import { z } from 'zod';
import { login, logoutRoute, refresh, register } from '../controllers/authController.js';

export const authRoutes = Router();

authRoutes.post(
  '/register',
  validateBody(z.object({ name: z.string().min(2), email: z.string().email(), password: z.string().min(8) })),
  register,
);

authRoutes.post(
  '/login',
  validateBody(z.object({ email: z.string().email(), password: z.string().min(1) })),
  login,
);

authRoutes.post('/refresh', refresh);
authRoutes.post('/logout', logoutRoute);
