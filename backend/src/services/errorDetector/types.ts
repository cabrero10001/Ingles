import type { ErrorType } from '@prisma/client';

export type DetectedError = {
  errorType: ErrorType;
  message: string;
  wrongExample: string;
  correctExample: string;
};
