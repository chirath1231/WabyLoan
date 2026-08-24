import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { api, setAuthToken } from '../api/client';
import { saveSession, loadSession, clearSession } from '../lib/storage';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const session = await loadSession();
      if (session.token) {
        setAuthToken(session.token);
        setToken(session.token);
        setUser(session.user);
      }
      setReady(true);
    })();
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await api.post('/auth/login', { email, password });
    setAuthToken(data.token);
    setToken(data.token);
    setUser(data.user);
    await saveSession(data.token, data.user);
    return data.user;
  }, []);

  const register = useCallback(async (email, password, name) => {
    const data = await api.post('/auth/register', { email, password, name });
    setAuthToken(data.token);
    setToken(data.token);
    setUser(data.user);
    await saveSession(data.token, data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    setAuthToken(null);
    setToken(null);
    setUser(null);
    await clearSession();
  }, []);

  const value = useMemo(
    () => ({ user, token, ready, isSignedIn: Boolean(token), login, register, logout }),
    [user, token, ready, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
