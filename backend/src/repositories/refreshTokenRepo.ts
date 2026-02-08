import { prisma } from '../lib/prisma.js';

export async function createRefreshToken(params: {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}) {
  return prisma.refreshToken.create({ data: params });
}

export async function findValidRefreshToken(tokenHash: string) {
  return prisma.refreshToken.findFirst({
    where: {
      tokenHash,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
  });
}

export async function revokeRefreshToken(id: string) {
  return prisma.refreshToken.update({ where: { id }, data: { revokedAt: new Date() } });
}
