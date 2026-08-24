'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Mail, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/Field';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';

export function AuthPanel({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleEmailSubmit() {
    setError(null);
    if (!/^\S+@\S+\.\S+$/.test(email) || password.length < 6) {
      setError('Enter a valid email and a password of at least 6 characters.');
      return;
    }
    try {
      if (mode === 'login') {
        await login.mutateAsync({ email, password });
      } else {
        await register.mutateAsync({ email, password, name: name || undefined });
      }
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    }
  }

  return (
    <div className="bar-in fixed right-4 top-[72px] z-50 w-[300px] rounded-2xl border border-line bg-card p-4 shadow-xl sm:right-6">
      <div className="bar-in flex items-center justify-between" style={{ animationDelay: '40ms' }}>
        <p className="text-[13px] font-semibold text-text-900">{t('signUpTitle')}</p>
        <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-teal-50">
          <X size={14} />
        </button>
      </div>

      <div className="bar-in mt-3 space-y-2" style={{ animationDelay: '90ms' }}>
        <a
          href={`${API_BASE_URL}/auth/google`}
          className="block w-full rounded-xl border-[1.5px] border-line bg-card px-4 py-2 text-center text-[13px] font-semibold hover:border-teal-600 hover:bg-teal-50"
        >
          {t('continueGoogle')}
        </a>
        <a
          href={`${API_BASE_URL}/auth/facebook`}
          className="block w-full rounded-xl border-[1.5px] border-line bg-card px-4 py-2 text-center text-[13px] font-semibold hover:border-teal-600 hover:bg-teal-50"
        >
          {t('continueFacebook')}
        </a>
      </div>

      <div className="bar-in my-3 flex items-center gap-2 text-[11px] font-semibold uppercase text-text-400" style={{ animationDelay: '140ms' }}>
        <span className="h-px flex-1 bg-line" />
        or
        <span className="h-px flex-1 bg-line" />
      </div>

      <div className="bar-in space-y-2" style={{ animationDelay: '190ms' }}>
        {mode === 'register' && <TextInput placeholder={t('nameLabel')} value={name} onChange={(e) => setName(e.target.value)} />}
        <TextInput placeholder={t('emailLabel')} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <TextInput placeholder={t('passwordLabel')} type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <Button onClick={handleEmailSubmit} disabled={login.isPending || register.isPending} className="w-full justify-center">
          <Mail size={14} /> {mode === 'login' ? t('logInBtn') : t('signUpBtn')}
        </Button>
      </div>

      <div className="bar-in mt-3 flex items-center justify-between text-[12px]" style={{ animationDelay: '230ms' }}>
        <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')} className="font-semibold text-teal-700 underline underline-offset-2">
          {mode === 'login' ? t('signUpBtn') : t('logInBtn')}
        </button>
        <button onClick={onClose} className="font-semibold text-text-600 hover:text-teal-700">
          {t('continueGuest')}
        </button>
      </div>

      {error && <p className="mt-2 text-[11.5px] text-danger">{error}</p>}
    </div>
  );
}
