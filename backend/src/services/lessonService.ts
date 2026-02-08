import { ErrorType } from '@prisma/client';
import { AppError } from '../errors/AppError.js';
import { prisma } from '../lib/prisma.js';
import { analyzeWriting } from './errorDetector/index.js';
import type { DetectedError } from './errorDetector/types.js';
import { aiAnalyzerEnabled } from '../config/env.js';

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function daysBetween(a: Date, b: Date): number {
  const da = startOfDay(a).getTime();
  const db = startOfDay(b).getTime();
  return Math.round((db - da) / (24 * 60 * 60 * 1000));
}

function normalizeText(input: string): string {
  return input.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function countVocabularyMatches(answer: string, vocabulary: string[]): number {
  const normalized = ` ${normalizeText(answer)} `;
  let count = 0;
  for (const word of vocabulary) {
    const candidate = normalizeText(word);
    if (!candidate) continue;
    if (normalized.includes(` ${candidate} `)) count += 1;
  }
  return count;
}

function lexicalDiversity(words: string[]): number {
  if (words.length === 0) return 0;
  const unique = new Set(words.map((w) => normalizeText(w)).filter(Boolean));
  return unique.size / words.length;
}

function buildQualityErrors(params: {
  answer: string;
  vocabulary: string[];
  previousAnswer: string | null;
  activityType: 'WRITING' | 'CONVERSATION';
}): DetectedError[] {
  const out: DetectedError[] = [];
  const words = params.answer.trim().split(/\s+/).filter(Boolean);
  const normalizedCurrent = normalizeText(params.answer);
  const normalizedPrevious = params.previousAnswer ? normalizeText(params.previousAnswer) : null;
  const minWords = params.activityType === 'CONVERSATION' ? 20 : 45;
  const minVocabulary = params.activityType === 'CONVERSATION' ? 2 : 3;

  if (words.length < minWords) {
    out.push({
      errorType: ErrorType.OTHER,
      message:
        params.activityType === 'CONVERSATION'
          ? 'Your response is too short for the conversation. Add more detail.'
          : 'Your answer is too short. Add more detail and examples.',
      wrongExample: 'Very short response with few details.',
      correctExample: 'A complete paragraph with clear explanation and examples.',
    });
  }

  const vocabMatches = countVocabularyMatches(params.answer, params.vocabulary);
  if (vocabMatches < minVocabulary) {
    out.push({
      errorType: ErrorType.OTHER,
      message: `Use at least ${minVocabulary} words from the lesson vocabulary.`,
      wrongExample: 'Text without target vocabulary usage.',
      correctExample: 'Include at least three key words from the lesson list.',
    });
  }

  if (normalizedPrevious && normalizedPrevious === normalizedCurrent) {
    out.push({
      errorType: ErrorType.OTHER,
      message: 'You repeated the same answer. Try writing a new version.',
      wrongExample: 'Submitting the exact same paragraph again.',
      correctExample: 'Rewrite with new ideas, examples, and structure.',
    });
  }

  const diversity = lexicalDiversity(words);
  if (words.length >= minWords && diversity < 0.4) {
    out.push({
      errorType: ErrorType.OTHER,
      message: 'Your text repeats too many words. Use more varied vocabulary.',
      wrongExample: 'Many repeated words and limited variation.',
      correctExample: 'Use synonyms and different sentence patterns.',
    });
  }

  return out;
}

function activityTypeForDay(goal: string, dayNumber: number): 'WRITING' | 'CONVERSATION' {
  const patternByGoal: Record<string, Array<'WRITING' | 'CONVERSATION'>> = {
    // 2 writing + 1 conversation
    IT: ['WRITING', 'WRITING', 'CONVERSATION'],
    BUSINESS: ['WRITING', 'WRITING', 'CONVERSATION'],
    JOB_INTERVIEW: ['WRITING', 'CONVERSATION', 'WRITING'],
    // balanced
    TRAVEL: ['CONVERSATION', 'WRITING'],
    DAILY_CONVERSATION: ['CONVERSATION', 'WRITING', 'CONVERSATION'],
    GAMING: ['CONVERSATION', 'WRITING'],
  };

  const pattern = patternByGoal[goal] ?? ['WRITING', 'CONVERSATION'];
  const index = (Math.max(1, dayNumber) - 1) % pattern.length;
  return pattern[index] ?? 'WRITING';
}

function buildConversationByGoal(goal: string) {
  const bank: Record<string, { context: string; lines: string[]; suggestedPhrases: string[] }> = {
    TRAVEL: {
      context: 'Simulacion: estas en el aeropuerto preguntando por tu vuelo.',
      lines: [
        'Agent: Good morning. May I see your passport?',
        'You: Sure, here it is.',
        'Agent: Your gate changed to B12.',
      ],
      suggestedPhrases: ['Could you repeat that, please?', 'Where is gate B12?', 'Thank you for your help.'],
    },
    JOB_INTERVIEW: {
      context: 'Simulacion: primera pregunta en una entrevista laboral.',
      lines: [
        'Interviewer: Tell me about yourself.',
        'You: I am a software developer with 3 years of experience.',
        'Interviewer: Why do you want this role?',
      ],
      suggestedPhrases: ['I enjoy solving problems.', 'I can contribute from day one.', 'I am excited about this opportunity.'],
    },
    IT: {
      context: 'Simulacion: revisando un bug con tu equipo.',
      lines: [
        'Teammate: The API returns a 500 error in production.',
        'You: I checked the logs and found a null value issue.',
        'Teammate: Can we deploy a quick fix today?',
      ],
      suggestedPhrases: ['I can reproduce the issue.', 'Let me open a pull request.', 'We can deploy after testing.'],
    },
    BUSINESS: {
      context: 'Simulacion: actualizacion breve en reunion de equipo.',
      lines: [
        'Manager: Could you share your project update?',
        'You: We finished phase one and started QA.',
        'Manager: Any blockers right now?',
      ],
      suggestedPhrases: ['The main blocker is...', 'We expect to finish by Friday.', 'I will send a follow-up email.'],
    },
    DAILY_CONVERSATION: {
      context: 'Simulacion: conversacion casual con un amigo.',
      lines: [
        'Friend: Hey, how is your week going?',
        'You: Pretty good, I have been very busy at work.',
        'Friend: Do you want to grab coffee later?',
      ],
      suggestedPhrases: ['That sounds great.', 'What time works for you?', 'See you later!'],
    },
    GAMING: {
      context: 'Simulacion: coordinacion rapida en partida online.',
      lines: [
        'Teammate: Two enemies on mid lane!',
        'You: I am rotating now. Save your ultimate.',
        'Teammate: Let us push after this fight.',
      ],
      suggestedPhrases: ['I need backup.', 'Push now.', 'Good game!'],
    },
  };

  return bank[goal] ?? {
    context: 'Simulacion de practica conversacional.',
    lines: ['Partner: Hello!', 'You: Hi, nice to meet you.'],
    suggestedPhrases: ['Could you explain that?', 'Let me try again.'],
  };
}

export async function getTodayLesson(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { currentGoal: true, currentDay: true } });
  if (!user) throw new AppError(404, 'NOT_FOUND', 'User not found');
  if (!user.currentGoal) throw new AppError(400, 'NO_GOAL', 'User has no goal selected');

  const tpl = await prisma.lessonTemplate.findUnique({
    where: { goal_dayNumber: { goal: user.currentGoal, dayNumber: user.currentDay } },
    select: { id: true, goal: true, dayNumber: true, title: true, microObjective: true, vocabulary: true, prompt: true },
  });
  if (!tpl) throw new AppError(404, 'NOT_FOUND', 'Lesson template not found');
  const activityType = activityTypeForDay(tpl.goal, tpl.dayNumber);

  return {
    ...tpl,
    activityType,
    conversation: buildConversationByGoal(tpl.goal),
  };
}

export async function completeLesson(userId: string, userAnswer: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, currentGoal: true, currentDay: true, streak: true },
  });
  if (!user) throw new AppError(404, 'NOT_FOUND', 'User not found');
  if (!user.currentGoal) throw new AppError(400, 'NO_GOAL', 'User has no goal selected');

  const tpl = await prisma.lessonTemplate.findUnique({
    where: { goal_dayNumber: { goal: user.currentGoal, dayNumber: user.currentDay } },
    select: { id: true, dayNumber: true, goal: true, vocabulary: true },
  });
  if (!tpl) throw new AppError(404, 'NOT_FOUND', 'Lesson template not found');
  const activityType = activityTypeForDay(String(tpl.goal), tpl.dayNumber);

  const previousLesson = await prisma.userLesson.findFirst({
    where: { userId },
    orderBy: { completedAt: 'desc' },
    select: { userAnswer: true },
  });

  const detectedRuleErrors = await analyzeWriting(userAnswer, { useAI: aiAnalyzerEnabled() });
  const detectedQualityErrors = buildQualityErrors({
    answer: userAnswer,
    vocabulary: tpl.vocabulary,
    previousAnswer: previousLesson?.userAnswer ?? null,
    activityType,
  });
  const detected = [...detectedRuleErrors, ...detectedQualityErrors];

  const penalty = detected.length === 0 ? 0 : Math.min(70, detected.length * 18);
  const score = Math.max(30, 100 - penalty);

  const lesson = await prisma.userLesson.create({
    data: {
      userId,
      lessonTemplateId: tpl.id,
      dayNumber: tpl.dayNumber,
      userAnswer,
      score,
    },
    select: { id: true, score: true, completedAt: true, dayNumber: true },
  });

  if (detected.length > 0) {
    await prisma.errorLog.createMany({
      data: detected.map((e) => ({
        userId,
        lessonId: lesson.id,
        errorType: e.errorType,
        message: e.message,
        wrongExample: e.wrongExample,
        correctExample: e.correctExample,
      })),
    });
  }

  // lastLesson is the one we just created, so grab previous completion too
  const prevLesson = await prisma.userLesson.findFirst({
    where: { userId, id: { not: lesson.id } },
    orderBy: { completedAt: 'desc' },
    select: { completedAt: true },
  });

  let newStreak = user.streak;
  if (!prevLesson) {
    newStreak = 1;
  } else {
    const diff = daysBetween(prevLesson.completedAt, lesson.completedAt);
    if (diff === 0) newStreak = user.streak;
    else if (diff === 1) newStreak = user.streak + 1;
    else newStreak = 1;
  }

  const nextDay = Math.min(30, user.currentDay + 1);
  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      currentDay: nextDay,
      streak: newStreak,
    },
    select: { currentDay: true, streak: true, currentGoal: true },
  });

  return {
    lesson,
    score,
    detectedErrors: detected,
    progress: updated,
    isComplete: nextDay === 30 && user.currentDay === 30,
  };
}

export async function topErrors(userId: string) {
  const grouped = await prisma.errorLog.groupBy({
    by: ['errorType'],
    where: { userId },
    _count: { errorType: true },
    orderBy: { _count: { errorType: 'desc' } },
    take: 5,
  });

  const results = [] as Array<{ errorType: ErrorType; count: number; sample: { wrong: string; correct: string; message: string } | null }>;

  for (const g of grouped) {
    const sample = await prisma.errorLog.findFirst({
      where: { userId, errorType: g.errorType },
      orderBy: { createdAt: 'desc' },
      select: { wrongExample: true, correctExample: true, message: true },
    });
    results.push({
      errorType: g.errorType,
      count: g._count.errorType,
      sample: sample ? { wrong: sample.wrongExample, correct: sample.correctExample, message: sample.message } : null,
    });
  }

  return results;
}

export async function errorHistoryByLesson(userId: string) {
  const lessons = await prisma.userLesson.findMany({
    where: { userId },
    orderBy: { completedAt: 'desc' },
    take: 30,
    select: {
      id: true,
      dayNumber: true,
      score: true,
      completedAt: true,
      userAnswer: true,
      lessonTemplate: {
        select: {
          title: true,
        },
      },
      errorLogs: {
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          errorType: true,
          message: true,
          wrongExample: true,
          correctExample: true,
          createdAt: true,
        },
      },
    },
  });

  return lessons
    .filter((lesson) => lesson.errorLogs.length > 0)
    .map((lesson) => ({
      lessonId: lesson.id,
      dayNumber: lesson.dayNumber,
      lessonTitle: lesson.lessonTemplate.title,
      score: lesson.score,
      completedAt: lesson.completedAt,
      userAnswer: lesson.userAnswer,
      errors: lesson.errorLogs.map((e) => ({
        id: e.id,
        errorType: e.errorType,
        message: e.message,
        wrongExample: e.wrongExample,
        correctExample: e.correctExample,
        createdAt: e.createdAt,
      })),
    }));
}
