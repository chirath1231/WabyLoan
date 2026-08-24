export type Theme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'wabyloan-theme';

export function getStoredTheme(): Theme | null {
  if (typeof window === 'undefined') return null;
  const value = window.localStorage.getItem(THEME_STORAGE_KEY);
  return value === 'dark' || value === 'light' ? value : null;
}

export function getPreferredTheme(): Theme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  window.localStorage.setItem(THEME_STORAGE_KEY, theme);
}
