import { createContext, useContext, useState, useCallback } from 'react';
import { api, apiErrorMessage } from '../api/client.js';

const AuthContext = createContext(null);

function loadStoredUser() {
  try {
    const raw = localStorage.getItem('waby_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(loadStoredUser());
  const [authPanelOpen, setAuthPanelOpen] = useState(false);
  const [authPanelMode, setAuthPanelMode] = useState('signup'); // 'signup' | 'login'

  const persist = (token, user) => {
    localStorage.setItem('waby_token', token);
    localStorage.setItem('waby_user', JSON.stringify(user));
    setUser(user);
  };

  const register = useCallback(async (email, password, name) => {
    const { data } = await api.post('/auth/register', { email, password, name });
    persist(data.token, data.user);
    return data.user;
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    persist(data.token, data.user);
    return data.user;
  }, []);

  const continueAsGuest = useCallback(() => {
    localStorage.removeItem('waby_token');
    const guest = { provider: 'guest', name: 'Guest', email: null };
    localStorage.setItem('waby_user', JSON.stringify(guest));
    setUser(guest);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('waby_token');
    localStorage.removeItem('waby_user');
    setUser(null);
  }, []);

  const isGuest = !!user && user.provider === 'guest';
  const isAuthenticated = !!user && !isGuest;
  const isRestricted = !user || isGuest;
  const isAdmin = !!user && user.role === 'admin';

  const openAuthPanel = useCallback((mode = 'signup') => {
    setAuthPanelMode(mode);
    setAuthPanelOpen(true);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user, isGuest, isAuthenticated, isRestricted, isAdmin,
        register, login, continueAsGuest, logout,
        authPanelOpen, setAuthPanelOpen, authPanelMode, setAuthPanelMode, openAuthPanel,
        apiErrorMessage,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
