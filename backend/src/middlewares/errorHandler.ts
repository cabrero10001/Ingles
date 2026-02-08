import type { NextFunction, Request, Response } from 'express';
import { isAppError } from '../errors/AppError.js';
import type { ApiError } from '../lib/http.js';

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  const fallback: ApiError = {
    status: 'error',
    error: { code: 'INTERNAL_ERROR', message: 'Unexpected error' },
  };

  if (isAppError(err)) {
    return res.status(err.statusCode).json({
      status: 'error',
      error: { code: err.code, message: err.message },
    } satisfies ApiError);
  }

  return res.status(500).json(fallback);
}
