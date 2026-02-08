import type { Request, Response, NextFunction } from 'express';
import { ok } from '../lib/http.js';
import { env, refreshCookieSecure } from '../config/env.js';
import { loginUser, logout, refreshCookieName, refreshSession, registerUser } from '../services/authService.js';

function cookieOptions() {
  return {
    httpOnly: true,
    secure: refreshCookieSecure(),
    sameSite: env.REFRESH_COOKIE_SAMESITE,
    path: '/api/auth',
  } as const;
}

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, email, password } = req.body as { name: string; email: string; password: string };
    const out = await registerUser({ name, email, password });
    res.cookie(refreshCookieName(), out.refreshToken, cookieOptions());
    return res.json(ok({ user: out.user, accessToken: out.accessToken }));
  } catch (e) {
    next(e);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body as { email: string; password: string };
    const out = await loginUser({ email, password });
    res.cookie(refreshCookieName(), out.refreshToken, cookieOptions());
    return res.json(ok({ user: out.user, accessToken: out.accessToken }));
  } catch (e) {
    next(e);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const token = (req as any).cookies?.[refreshCookieName()] as string | undefined;
    const out = await refreshSession(token ?? '');
    res.cookie(refreshCookieName(), out.refreshToken, cookieOptions());
    return res.json(ok({ accessToken: out.accessToken }));
  } catch (e) {
    next(e);
  }
}

export async function logoutRoute(req: Request, res: Response, next: NextFunction) {
  try {
    const token = (req as any).cookies?.[refreshCookieName()] as string | undefined;
    await logout(token ?? null);
    res.clearCookie(refreshCookieName(), cookieOptions());
    return res.json(ok({}));
  } catch (e) {
    next(e);
  }
}
