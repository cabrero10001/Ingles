import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { history, top } from '../controllers/errorController.js';

export const errorRoutes = Router();
errorRoutes.get('/errors/top', requireAuth, top);
errorRoutes.get('/errors/history', requireAuth, history);
