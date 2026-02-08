import { ErrorType } from '@prisma/client';
import type { DetectedError } from './types.js';

export function detectRuleBasedErrors(text: string): DetectedError[] {
  const t = text.trim();
  if (!t) return [];

  const lower = t.toLowerCase();
  const out: DetectedError[] = [];

  // Common Spanish speaker pattern: "I have X years".
  const yearsMatch = lower.match(/\bi have\s+(\d{1,3})\s+years\b/);
  if (yearsMatch) {
    const n = yearsMatch[1];
    out.push({
      errorType: ErrorType.OTHER,
      message: 'Age is expressed with "to be" in English.',
      wrongExample: `I have ${n} years.`,
      correctExample: `I am ${n} years old.`,
    });
  }

  // Prepositions: good at (not good in).
  if (lower.includes('good in ')) {
    out.push({
      errorType: ErrorType.PREPOSITION,
      message: 'Use "good at" for skills.',
      wrongExample: 'I am good in programming.',
      correctExample: 'I am good at programming.',
    });
  }

  // Articles: "the" with proper nouns like Python.
  if (lower.includes('the python')) {
    out.push({
      errorType: ErrorType.ARTICLE,
      message: 'Do not use "the" with programming languages in general.',
      wrongExample: 'I need to learn the Python.',
      correctExample: 'I need to learn Python.',
    });
  }

  // Basic tense heuristic: "since 2020" often pairs with present perfect.
  if (lower.match(/\bsince\s+\d{4}\b/) && lower.match(/\bi\s+worked\b/)) {
    out.push({
      errorType: ErrorType.TENSE,
      message: 'Use present perfect for actions that started in the past and continue.',
      wrongExample: 'I worked here since 2020.',
      correctExample: 'I have worked here since 2020.',
    });
  }

  // In/on/at quick checks.
  if (lower.match(/\bat\s+monday\b/) || lower.match(/\bin\s+monday\b/)) {
    out.push({
      errorType: ErrorType.PREPOSITION,
      message: 'Use "on" with days (on Monday).',
      wrongExample: 'I will do it in Monday.',
      correctExample: 'I will do it on Monday.',
    });
  }

  return out;
}
