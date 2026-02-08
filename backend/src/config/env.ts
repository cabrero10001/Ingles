import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.string().optional().default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  CORS_ORIGINS: z.string().default('http://localhost:5173'),
  DATABASE_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL: z.string().default('30d'),
  REFRESH_COOKIE_NAME: z.string().default('lp_refresh'),
  REFRESH_COOKIE_SECURE: z.string().default('false'),
  REFRESH_COOKIE_SAMESITE: z.enum(['lax', 'strict', 'none']).default('lax'),
  AI_ANALYZER_ENABLED: z.string().default('false'),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default('gpt-4o-mini'),
});

export const env = envSchema.parse(process.env);

export function corsOrigins(): string[] {
  return env.CORS_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean);
}

export function refreshCookieSecure(): boolean {
  return env.REFRESH_COOKIE_SECURE === 'true';
}

export function aiAnalyzerEnabled(): boolean {
  return env.AI_ANALYZER_ENABLED === 'true';
}
