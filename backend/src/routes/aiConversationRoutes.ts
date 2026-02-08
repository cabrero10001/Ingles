import { ConversationMode, ConversationPersona } from '@prisma/client';
import { Router } from 'express';
import { z } from 'zod';
import {
  getPersonas,
  getSession,
  sendMessage,
  startSession,
} from '../controllers/aiConversationController.js';
import { requireAuth } from '../middlewares/auth.js';
import { validateBody } from '../middlewares/validate.js';

export const aiConversationRoutes = Router();

aiConversationRoutes.get('/ai-conversations/personas', requireAuth, getPersonas);
aiConversationRoutes.post(
  '/ai-conversations/start',
  requireAuth,
  validateBody(
    z.object({
      persona: z.nativeEnum(ConversationPersona),
      mode: z.nativeEnum(ConversationMode).optional(),
    }),
  ),
  startSession,
);

aiConversationRoutes.get('/ai-conversations/:sessionId', requireAuth, getSession);

aiConversationRoutes.post(
  '/ai-conversations/:sessionId/message',
  requireAuth,
  validateBody(
    z.object({
      message: z.string().min(1).max(2000),
    }),
  ),
  sendMessage,
);
