import React, { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/auth/AuthContext';

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (auth.status === 'unauthenticated') navigate('/');
  }, [auth.status, navigate]);

  if (auth.status === 'loading') return null;
  if (auth.status === 'unauthenticated') return null;
  return <>{children}</>;
}
