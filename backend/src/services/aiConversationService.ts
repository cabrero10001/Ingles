import {
  ConversationMode,
  ConversationPersona,
  ConversationRole,
  ErrorType,
  Goal,
} from '@prisma/client';
import { AppError } from '../errors/AppError.js';
import { env } from '../config/env.js';
import { prisma } from '../lib/prisma.js';
import { analyzeWriting } from './errorDetector/index.js';

type PersonaInfo = {
  key: ConversationPersona;
  title: string;
  description: string;
};

const PERSONAS: PersonaInfo[] = [
  { key: ConversationPersona.BARISTA, title: 'Barista', description: 'Pedir bebidas y conversar en cafeteria.' },
  { key: ConversationPersona.RECRUITER, title: 'Reclutador', description: 'Simular entrevista laboral breve.' },
  { key: ConversationPersona.FOREIGN_FRIEND, title: 'Amigo extranjero', description: 'Conversacion cotidiana relajada.' },
];

const goalHints: Record<Goal, string> = {
  TRAVEL: 'Focus on travel scenarios, directions, airport and hotels.',
  JOB_INTERVIEW: 'Focus on interview communication and professional experience.',
  IT: 'Focus on technical communication, bugs, APIs and teamwork.',
  BUSINESS: 'Focus on meetings, updates and professional tone.',
  DAILY_CONVERSATION: 'Focus on natural daily conversation and confidence.',
  GAMING: 'Focus on team communication and quick strategic phrases.',
};

function personaSystemPrompt(persona: ConversationPersona, goal: Goal) {
  const personaPrompt: Record<ConversationPersona, string> = {
    BARISTA: 'You are a friendly barista. Keep replies short (1-3 sentences) and realistic for a coffee shop.',
    RECRUITER: 'You are a recruiter interviewer. Ask practical interview questions with concise follow-ups.',
    FOREIGN_FRIEND: 'You are a friendly foreign friend chatting casually about day-to-day topics.',
  };

  return [
    personaPrompt[persona],
    goalHints[goal],
    'Speak in English only. Keep tone encouraging and interactive.',
    'Ask one follow-up question often to keep the conversation active.',
  ].join(' ');
}

async function generateAssistantReply(params: {
  persona: ConversationPersona;
  goal: Goal;
  history: Array<{ role: ConversationRole; content: string }>;
}): Promise<string> {
  if (!env.OPENAI_API_KEY) {
    const fallback = {
      BARISTA: 'Great! What drink would you like today, and what size?',
      RECRUITER: 'Thanks for sharing. Can you describe one project you are proud of?',
      FOREIGN_FRIEND: 'Nice! What did you do this week that was interesting?',
    };
    return fallback[params.persona];
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: env.OPENAI_MODEL,
        temperature: 0.5,
      messages: [
          { role: 'system', content: personaSystemPrompt(params.persona, params.goal) },
          ...params.history.map((m: { role: ConversationRole; content: string }) => ({
            role: m.role === ConversationRole.USER ? 'user' : 'assistant',
            content: m.content,
          })),
        ],
      }),
    });

    if (!response.ok) throw new Error('OpenAI error');
    const json = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const content = json.choices?.[0]?.message?.content?.trim();
    if (!content) throw new Error('No content');
    return content;
  } catch {
    return 'Good point. Can you say the same idea using different words?';
  }
}

function mapErrorTypeCount(type: string) {
  switch (type) {
    case 'TENSE':
    case 'PREPOSITION':
    case 'WORD_ORDER':
    case 'ARTICLE':
    case 'SPELLING':
      return type as ErrorType;
    default:
      return ErrorType.OTHER;
  }
}

export function listPersonas() {
  return PERSONAS;
}

export async function startConversationSession(userId: string, params: { persona: ConversationPersona; mode: ConversationMode }) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { currentGoal: true } });
  if (!user) throw new AppError(404, 'NOT_FOUND', 'User not found');
  if (!user.currentGoal) throw new AppError(400, 'NO_GOAL', 'User has no goal selected');

  const session = await prisma.conversationSession.create({
    data: {
      userId,
      persona: params.persona,
      mode: params.mode,
      goal: user.currentGoal,
      messages: {
        create: [
          {
            role: ConversationRole.ASSISTANT,
            content:
              params.persona === ConversationPersona.RECRUITER
                ? 'Hi! Let us start. Could you introduce yourself in 2-3 sentences?'
                : params.persona === ConversationPersona.BARISTA
                  ? 'Welcome! What would you like to order today?'
                  : 'Hey! Nice to chat with you. How is your day going?',
          },
        ],
      },
    },
    include: { messages: { orderBy: { createdAt: 'asc' } } },
  });

  return session;
}

export async function getConversationSession(userId: string, sessionId: string) {
  const session = await prisma.conversationSession.findFirst({
    where: { id: sessionId, userId },
    include: { messages: { orderBy: { createdAt: 'asc' } } },
  });
  if (!session) throw new AppError(404, 'NOT_FOUND', 'Conversation session not found');
  return session;
}

export async function sendConversationMessage(userId: string, sessionId: string, content: string) {
  const session = await prisma.conversationSession.findFirst({
    where: { id: sessionId, userId },
    include: {
      messages: { orderBy: { createdAt: 'asc' }, take: 12 },
    },
  });
  if (!session) throw new AppError(404, 'NOT_FOUND', 'Conversation session not found');
  if (session.endedAt) throw new AppError(400, 'SESSION_CLOSED', 'Conversation session is closed');

  const userMessage = await prisma.conversationMessage.create({
    data: {
      sessionId,
      role: ConversationRole.USER,
      content,
    },
  });

  const detected = await analyzeWriting(content, { useAI: true });
  if (detected.length > 0) {
    await prisma.errorLog.createMany({
      data: detected.map((e) => ({
        userId,
        errorType: mapErrorTypeCount(e.errorType),
        message: e.message,
        wrongExample: e.wrongExample,
        correctExample: e.correctExample,
      })),
    });
  }

  const assistantText = await generateAssistantReply({
    persona: session.persona,
    goal: session.goal,
    history: [
      ...session.messages.map((m) => ({ role: m.role, content: m.content })),
      { role: ConversationRole.USER, content },
    ],
  });

  const assistantMessage = await prisma.conversationMessage.create({
    data: {
      sessionId,
      role: ConversationRole.ASSISTANT,
      content: assistantText,
    },
  });

  return {
    userMessage,
    assistantMessage,
    feedback: {
      totalDetected: detected.length,
      frequentHints: detected.slice(0, 3).map((d) => d.message),
    },
  };
}
