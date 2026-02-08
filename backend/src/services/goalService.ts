import type { Goal } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../errors/AppError.js';

export async function setUserGoal(userId: string, goal: Goal) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { currentGoal: goal, currentDay: 1, streak: 0 },
    select: { id: true, currentGoal: true, currentDay: true, streak: true },
  }).catch(() => null);
  if (!user) throw new AppError(404, 'NOT_FOUND', 'User not found');
  return user;
}
