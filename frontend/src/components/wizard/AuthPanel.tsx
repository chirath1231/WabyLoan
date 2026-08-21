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
    <div className="border-b border-line bg-teal-50">
      <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
        <div className="flex flex-wrap items-center gap-3">
          <p className="mr-1 text-[12.5px] font-semibold text-teal-800">{t('signUpTitle')}:</p>
          <a href={`${API_BASE_URL}/auth/google`} className="rounded-xl border-[1.5px] border-line bg-white px-4 py-2 text-[13px] font-semibold hover:border-teal-600 hover:bg-teal-50">
            {t('continueGoogle')}
          </a>
          <a href={`${API_BASE_URL}/auth/facebook`} className="rounded-xl border-[1.5px] border-line bg-white px-4 py-2 text-[13px] font-semibold hover:border-teal-600 hover:bg-teal-50">
            {t('continueFacebook')}
          </a>
          <Button variant="ghost" onClick={onClose}>
            {t('continueGuest')}
          </Button>
          <button onClick={onClose} className="ml-auto flex h-7 w-7 items-center justify-center rounded-full hover:bg-white/70">
            <X size={14} />
          </button>
        </div>

        <div className="mt-3 flex flex-wrap items-end gap-2">
          {mode === 'register' && (
            <div className="w-44">
              <TextInput placeholder={t('nameLabel')} value={name} onChange={(e) => setName(e.target.value)} />
            </div>
          )}
          <div className="w-52">
            <TextInput placeholder={t('emailLabel')} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="w-40">
            <TextInput placeholder={t('passwordLabel')} type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Button onClick={handleEmailSubmit} disabled={login.isPending || register.isPending}>
            <Mail size={14} /> {mode === 'login' ? t('logInBtn') : t('signUpBtn')}
          </Button>
          <button
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            className="text-[12.5px] font-semibold text-teal-700 underline underline-offset-2"
          >
            {mode === 'login' ? t('signUpBtn') : t('logInBtn')}
          </button>
        </div>
        {error && <p className="mt-1.5 text-[11.5px] text-danger">{error}</p>}
      </div>
    </div>
  );
}
