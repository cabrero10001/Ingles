import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { apiRateLimit } from './middlewares/rateLimit.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { corsOrigins } from './config/env.js';
import { authRoutes } from './routes/authRoutes.js';
import { meRoutes } from './routes/meRoutes.js';
import { goalRoutes } from './routes/goalRoutes.js';
import { lessonRoutes } from './routes/lessonRoutes.js';
import { errorRoutes } from './routes/errorRoutes.js';
import { challengeRoutes } from './routes/challengeRoutes.js';
import { aiConversationRoutes } from './routes/aiConversationRoutes.js';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(apiRateLimit);
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());
  app.use(
    cors({
      origin: corsOrigins(),
      credentials: true,
    }),
  );

  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

  app.use('/api/auth', authRoutes);
  app.use('/api', meRoutes);
  app.use('/api', goalRoutes);
  app.use('/api', lessonRoutes);
  app.use('/api', errorRoutes);
  app.use('/api', challengeRoutes);
  app.use('/api', aiConversationRoutes);

  app.use(errorHandler);
  return app;
}
