import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { me } from '../controllers/meController.js';

export const meRoutes = Router();
meRoutes.get('/me', requireAuth, me);
