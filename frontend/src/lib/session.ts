import { cookies } from 'next/headers';

export const SESSION_COOKIE = 'wl_token';

export function getServerToken(): string | undefined {
  return cookies().get(SESSION_COOKIE)?.value;
}

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:4000';

export interface SessionUser {
  id: string;
  email: string | null;
  name: string | null;
  role: 'user' | 'admin';
  authProvider: string;
}

/** Server-side only — resolves the current session user (or null for guest) via the backend. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const token = getServerToken();
  if (!token) return null;
  try {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return (await res.json()) as SessionUser;
  } catch {
    return null;
  }
}
