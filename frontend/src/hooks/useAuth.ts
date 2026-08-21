'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/apiClient';

export interface SessionUser {
  id: string;
  email: string | null;
  name: string | null;
  role: 'user' | 'admin';
  authProvider: string;
}

export function useAuth() {
  const queryClient = useQueryClient();

  const meQuery = useQuery<SessionUser>({
    queryKey: ['me'],
    queryFn: () => api.get<SessionUser>('/auth/me'),
    retry: false,
    // A 401 (guest) is expected, not an error worth surfacing.
    throwOnError: false,
  });

  const login = useMutation({
    mutationFn: async (input: { email: string; password: string }) => {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed.');
      return data.user as SessionUser;
    },
    onSuccess: (user) => queryClient.setQueryData(['me'], user),
  });

  const register = useMutation({
    mutationFn: async (input: { email: string; password: string; name?: string }) => {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed.');
      return data.user as SessionUser;
    },
    onSuccess: (user) => queryClient.setQueryData(['me'], user),
  });

  const logout = useMutation({
    mutationFn: async () => {
      await fetch('/api/auth/logout', { method: 'POST' });
    },
    onSuccess: () => queryClient.setQueryData(['me'], null),
  });

  const user = meQuery.data ?? null;
  // SRS §6.2 — a guest is anyone without a session, including someone who explicitly picked
  // "Continue as Guest" (there is no separate guest auth record; absence of a user IS guest mode).
  const isRestricted = !user;

  return { user, isRestricted, isLoading: meQuery.isLoading, login, register, logout };
}
