import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translate, SUPPORTED_LANGUAGES } from '../i18n/translations';
import { setApiLanguage } from '../api/client';

const LANGUAGE_KEY = 'wabyloan.language';
const SUPPORTED_CODES = SUPPORTED_LANGUAGES.map((l) => l.code);

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState('en');

  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem(LANGUAGE_KEY);
      if (stored && SUPPORTED_CODES.includes(stored)) {
        setLanguageState(stored);
        setApiLanguage(stored);
      }
    })();
  }, []);

  const setLanguage = useCallback((lang) => {
    if (!SUPPORTED_CODES.includes(lang)) return;
    setLanguageState(lang);
    setApiLanguage(lang);
    AsyncStorage.setItem(LANGUAGE_KEY, lang).catch(() => {});
  }, []);

  const t = useCallback((key, params) => translate(language, key, params), [language]);

  const value = useMemo(
    () => ({ language, setLanguage, t, languages: SUPPORTED_LANGUAGES }),
    [language, setLanguage, t],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
