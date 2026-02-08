import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api, setAccessToken } from '../../services/api';

export type MeUser = {
  id: string;
  name: string;
  email: string;
  currentGoal: string | null;
  currentDay: number;
  streak: number;
};

type AuthState = {
  status: 'loading' | 'authenticated' | 'unauthenticated';
  user: MeUser | null;
  login: (email: string, password: string) => Promise<MeUser>;
  register: (name: string, email: string, password: string) => Promise<MeUser>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

async function fetchMe(): Promise<MeUser> {
  const out = await api.get<{ user: MeUser }>('/me');
  return out.user;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthState['status']>('loading');
  const [user, setUser] = useState<MeUser | null>(null);

  const refresh = async () => {
    try {
      const out = await api.post<{ accessToken: string }>('/auth/refresh');
      setAccessToken(out.accessToken);
      const me = await fetchMe();
      setUser(me);
      setStatus('authenticated');
    } catch {
      setAccessToken(null);
      setUser(null);
      setStatus('unauthenticated');
    }
  };

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      status,
      user,
      async login(email, password) {
        const out = await api.post<{ user: MeUser; accessToken: string }>('/auth/login', { email, password });
        setAccessToken(out.accessToken);
        setUser(out.user);
        setStatus('authenticated');
        return out.user;
      },
      async register(name, email, password) {
        const out = await api.post<{ user: MeUser; accessToken: string }>('/auth/register', { name, email, password });
        setAccessToken(out.accessToken);
        setUser(out.user);
        setStatus('authenticated');
        return out.user;
      },
      async logout() {
        try {
          await api.post('/auth/logout');
        } finally {
          setAccessToken(null);
          setUser(null);
          setStatus('unauthenticated');
        }
      },
      refresh,
    }),
    [status, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
