import type { DetectedError } from './types.js';
import { env } from '../../config/env.js';

const ALLOWED_ERROR_TYPES = ['TENSE', 'PREPOSITION', 'WORD_ORDER', 'ARTICLE', 'SPELLING', 'OTHER'] as const;

type AIErrorShape = {
  errorType: string;
  message: string;
  wrongExample: string;
  correctExample: string;
};

function sanitizeError(item: AIErrorShape): DetectedError | null {
  if (!item || typeof item !== 'object') return null;
  const errorType = ALLOWED_ERROR_TYPES.includes(item.errorType as any) ? item.errorType : 'OTHER';
  const message = typeof item.message === 'string' ? item.message.trim() : '';
  const wrongExample = typeof item.wrongExample === 'string' ? item.wrongExample.trim() : '';
  const correctExample = typeof item.correctExample === 'string' ? item.correctExample.trim() : '';
  if (!message || !wrongExample || !correctExample) return null;
  return {
    errorType,
    message,
    wrongExample,
    correctExample,
  } as DetectedError;
}

function extractJsonArray(raw: string): unknown[] {
  const trimmed = raw.trim();
  try {
    const parsed = JSON.parse(trimmed);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    const start = trimmed.indexOf('[');
    const end = trimmed.lastIndexOf(']');
    if (start === -1 || end === -1 || end <= start) return [];
    try {
      const parsed = JSON.parse(trimmed.slice(start, end + 1));
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
}

export async function analyzeWithAI(_text: string): Promise<DetectedError[]> {
  if (!env.OPENAI_API_KEY) return [];

  const prompt = [
    'You are an English writing evaluator for Spanish-speaking learners.',
    'Detect relevant writing mistakes and return ONLY a JSON array.',
    'Each item must have: errorType, message, wrongExample, correctExample.',
    `errorType must be one of: ${ALLOWED_ERROR_TYPES.join(', ')}.`,
    'Keep message concise and actionable (max 120 chars).',
    'If there are no clear mistakes, return [].',
    '',
    'User text:',
    _text,
  ].join('\n');

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: env.OPENAI_MODEL,
        temperature: 0.1,
        messages: [
          { role: 'system', content: 'Return strict JSON only. No markdown.' },
          { role: 'user', content: prompt },
        ],
      }),
    });

    if (!response.ok) return [];
    const body = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const raw = body.choices?.[0]?.message?.content;
    if (!raw) return [];

    const arr = extractJsonArray(raw);
    return arr
      .map((item) => sanitizeError(item as AIErrorShape))
      .filter((item): item is DetectedError => item !== null);
  } catch {
    return [];
  }
}
