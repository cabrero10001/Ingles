import { AppError } from '../errors/AppError.js';
import { prisma } from '../lib/prisma.js';

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      currentGoal: true,
      currentDay: true,
      streak: true,
      createdAt: true,
    },
  });
  if (!user) throw new AppError(404, 'NOT_FOUND', 'User not found');
  return user;
}
