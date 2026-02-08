import type { NextFunction, Request, Response } from 'express';
import { ConversationMode, ConversationPersona } from '@prisma/client';
import { ok } from '../lib/http.js';
import type { AuthedRequest } from '../middlewares/auth.js';
import {
  getConversationSession,
  listPersonas,
  sendConversationMessage,
  startConversationSession,
} from '../services/aiConversationService.js';

export async function getPersonas(_req: Request, res: Response, next: NextFunction) {
  try {
    return res.json(ok({ personas: listPersonas() }));
  } catch (e) {
    next(e);
  }
}

export async function startSession(req: Request, res: Response, next: NextFunction) {
  try {
    const { persona, mode } = req.body as { persona: ConversationPersona; mode?: ConversationMode };
    const session = await startConversationSession((req as AuthedRequest).userId, {
      persona,
      mode: mode ?? ConversationMode.TEXT,
    });
    return res.json(ok({ session }));
  } catch (e) {
    next(e);
  }
}

export async function getSession(req: Request, res: Response, next: NextFunction) {
  try {
    const sessionId = req.params.sessionId;
    if (!sessionId) throw new Error('Missing session id');
    const session = await getConversationSession((req as AuthedRequest).userId, sessionId);
    return res.json(ok({ session }));
  } catch (e) {
    next(e);
  }
}

export async function sendMessage(req: Request, res: Response, next: NextFunction) {
  try {
    const sessionId = req.params.sessionId;
    if (!sessionId) throw new Error('Missing session id');
    const { message } = req.body as { message: string };
    const out = await sendConversationMessage((req as AuthedRequest).userId, sessionId, message);
    return res.json(ok(out));
  } catch (e) {
    next(e);
  }
}
