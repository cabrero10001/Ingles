import type { Goal } from '@prisma/client';
import { AppError } from '../errors/AppError.js';
import { prisma } from '../lib/prisma.js';

const CHALLENGE_POINTS = 10;

type ChallengeTemplate = {
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};

const BANK: Record<Goal, ChallengeTemplate[]> = {
  TRAVEL: [
    {
      prompt: 'Where is the boarding gate?',
      options: ['Donde esta la puerta de embarque?', 'Cuanto cuesta el boleto?', 'Donde queda el hotel?', 'A que hora es la reunion?'],
      correctIndex: 0,
      explanation: 'Boarding gate significa puerta de embarque.',
    },
    {
      prompt: 'I would like a window seat, please.',
      options: ['Quiero una mesa para dos.', 'Me gustaria un asiento de ventana, por favor.', 'Donde recojo mi equipaje?', 'Necesito cambiar dinero.'],
      correctIndex: 1,
      explanation: 'Window seat es asiento de ventana.',
    },
  ],
  JOB_INTERVIEW: [
    {
      prompt: 'I am a fast learner and I adapt quickly.',
      options: ['Soy puntual y trabajo solo.', 'Aprendo rapido y me adapto rapidamente.', 'Prefiero no trabajar en equipo.', 'No tengo experiencia laboral.'],
      correctIndex: 1,
      explanation: 'Fast learner = aprende rapido; adapt quickly = adaptarse rapido.',
    },
    {
      prompt: 'My main strength is problem solving.',
      options: ['Mi principal fortaleza es resolver problemas.', 'Mi principal fortaleza es hablar frances.', 'Mi principal fortaleza es llegar tarde.', 'Mi principal fortaleza es trabajar menos.'],
      correctIndex: 0,
      explanation: 'Problem solving significa resolucion de problemas.',
    },
  ],
  IT: [
    {
      prompt: 'We need to deploy the fix to production.',
      options: ['Necesitamos enviar un correo al cliente.', 'Necesitamos desplegar la correccion a produccion.', 'Necesitamos borrar la base de datos.', 'Necesitamos comprar otro servidor hoy.'],
      correctIndex: 1,
      explanation: 'Deploy the fix to production = desplegar la correccion a produccion.',
    },
    {
      prompt: 'This endpoint returns user profile data.',
      options: ['Este endpoint devuelve datos del perfil de usuario.', 'Este endpoint elimina todos los usuarios.', 'Este endpoint cambia la contrasena.', 'Este endpoint detiene el servidor.'],
      correctIndex: 0,
      explanation: 'Returns means devuelve.',
    },
  ],
  BUSINESS: [
    {
      prompt: 'Let us align on the project timeline.',
      options: ['Vamos a alinearnos sobre el cronograma del proyecto.', 'Vamos a cancelar el proyecto hoy.', 'Vamos a cerrar todas las tareas.', 'Vamos a reducir el presupuesto a cero.'],
      correctIndex: 0,
      explanation: 'Align on timeline = ponerse de acuerdo sobre el cronograma.',
    },
    {
      prompt: 'Please send a follow-up email after the meeting.',
      options: ['Por favor envia un correo de seguimiento despues de la reunion.', 'Por favor llama al cliente ahora.', 'Por favor imprime el contrato.', 'Por favor cambia el logo.'],
      correctIndex: 0,
      explanation: 'Follow-up email = correo de seguimiento.',
    },
  ],
  DAILY_CONVERSATION: [
    {
      prompt: 'What are you up to this weekend?',
      options: ['A que hora llegaste hoy?', 'Que planes tienes este fin de semana?', 'Quieres un cafe ahora?', 'Donde estudias ingles?'],
      correctIndex: 1,
      explanation: 'What are you up to? = que planes tienes?',
    },
    {
      prompt: 'That sounds great to me.',
      options: ['Eso me suena excelente.', 'Eso me suena peligroso.', 'Eso no tiene sentido.', 'Eso fue muy temprano.'],
      correctIndex: 0,
      explanation: 'That sounds great = suena excelente.',
    },
  ],
  GAMING: [
    {
      prompt: 'Push mid and secure the objective.',
      options: ['Defiendan base y esperen.', 'Empujen por medio y aseguren el objetivo.', 'Desconectense del juego.', 'Cambien de servidor ahora.'],
      correctIndex: 1,
      explanation: 'Push mid = avanzar por medio; secure objective = asegurar objetivo.',
    },
    {
      prompt: 'My ultimate is ready in ten seconds.',
      options: ['Mi habilidad definitiva estara lista en diez segundos.', 'Mi teclado no funciona bien.', 'Voy a salir de la partida.', 'No tengo conexion a internet.'],
      correctIndex: 0,
      explanation: 'Ultimate is ready = habilidad definitiva lista.',
    },
  ],
};

function pickChallenge(goal: Goal, currentDay: number) {
  const templates = BANK[goal];
  const index = (Math.max(1, currentDay) - 1) % templates.length;
  const template = templates[index];
  if (!template) {
    throw new AppError(500, 'CHALLENGE_CONFIG_ERROR', 'Challenge bank is not configured correctly');
  }
  return { template, index };
}

function startOfWeek(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function getTodayChallenge(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { currentGoal: true, currentDay: true },
  });
  if (!user) throw new AppError(404, 'NOT_FOUND', 'User not found');
  if (!user.currentGoal) throw new AppError(400, 'NO_GOAL', 'User has no goal selected');

  const { template, index } = pickChallenge(user.currentGoal, user.currentDay);
  const challengeId = `${user.currentGoal}:${user.currentDay}:${index}`;

  return {
    challengeId,
    dayNumber: user.currentDay,
    goal: user.currentGoal,
    prompt: template.prompt,
    options: template.options,
  };
}

export async function answerTodayChallenge(userId: string, params: { challengeId: string; selectedIndex: number }) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { currentGoal: true, currentDay: true },
  });
  if (!user) throw new AppError(404, 'NOT_FOUND', 'User not found');
  if (!user.currentGoal) throw new AppError(400, 'NO_GOAL', 'User has no goal selected');

  const { template, index } = pickChallenge(user.currentGoal, user.currentDay);
  const expectedId = `${user.currentGoal}:${user.currentDay}:${index}`;
  if (params.challengeId !== expectedId) {
    throw new AppError(400, 'INVALID_CHALLENGE', 'Challenge is outdated. Refresh and try again.');
  }
  if (params.selectedIndex < 0 || params.selectedIndex > template.options.length - 1) {
    throw new AppError(400, 'INVALID_OPTION', 'Invalid selected option');
  }

  const isCorrect = params.selectedIndex === template.correctIndex;
  const points = isCorrect ? CHALLENGE_POINTS : 0;

  await prisma.challengeAttempt.upsert({
    where: { userId_challengeId: { userId, challengeId: expectedId } },
    create: {
      userId,
      challengeId: expectedId,
      goal: user.currentGoal,
      dayNumber: user.currentDay,
      selectedIndex: params.selectedIndex,
      correctIndex: template.correctIndex,
      isCorrect,
      points,
    },
    update: {
      selectedIndex: params.selectedIndex,
      correctIndex: template.correctIndex,
      isCorrect,
      points,
    },
  });

  const weeklyStats = await getWeeklyChallengeStats(userId);

  return {
    challengeId: expectedId,
    isCorrect,
    correctIndex: template.correctIndex,
    selectedIndex: params.selectedIndex,
    explanation: template.explanation,
    points,
    weeklyStats,
  };
}

export async function getWeeklyChallengeStats(userId: string) {
  const weekStart = startOfWeek();
  const attempts = await prisma.challengeAttempt.findMany({
    where: {
      userId,
      createdAt: { gte: weekStart },
    },
    select: { isCorrect: true, points: true },
  });

  const answeredCount = attempts.length;
  const correctCount = attempts.filter((a) => a.isCorrect).length;
  const totalPoints = attempts.reduce((sum, a) => sum + a.points, 0);
  return {
    weekStart,
    answeredCount,
    correctCount,
    totalPoints,
  };
}
