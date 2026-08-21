'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Landmark, LogOut, ShieldCheck, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { AuthPanel } from './AuthPanel';

export function Header() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-line bg-white/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link href="/" className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-teal-700">
              <Landmark size={18} className="text-white" />
            </div>
            <div className="min-w-0">
              <p className="truncate font-display text-[15px] font-bold leading-none">
                Waby <span className="text-teal-600">Loan</span>
              </p>
              <p className="truncate font-mono text-[10.5px] tracking-wide text-text-400">{t('tagline')}</p>
            </div>
          </Link>

          <div className="flex flex-shrink-0 items-center gap-2.5 sm:gap-3">
            <select
              value={i18n.language}
              onChange={(e) => i18n.changeLanguage(e.target.value)}
              className="rounded-lg border border-line bg-white px-2 py-1.5 text-[12.5px] font-semibold"
              aria-label="Language"
            >
              <option value="en">EN</option>
              <option value="si">සිංහල</option>
              <option value="ta">தமிழ்</option>
            </select>

            {user ? (
              <div className="flex items-center gap-2">
                {user.role === 'admin' && (
                  <Link href="/admin" className="flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-[12.5px] font-semibold text-teal-700 hover:border-teal-600">
                    <ShieldCheck size={14} /> {t('adminConsole')}
                  </Link>
                )}
                <span className="hidden items-center gap-1.5 text-[13px] font-semibold text-text-900 sm:flex">
                  <User size={14} /> {user.name || user.email}
                </span>
                <button
                  onClick={() => logout.mutate()}
                  className="flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-[12.5px] font-semibold text-text-600 hover:border-teal-600 hover:text-teal-700"
                >
                  <LogOut size={14} /> {t('signOut')}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setAuthOpen((v) => !v)}
                className="rounded-lg bg-teal-700 px-3 py-1.5 text-[12.5px] font-semibold text-white hover:bg-teal-800"
              >
                {t('signIn')}
              </button>
            )}
          </div>
        </div>
      </header>
      {authOpen && !user && <AuthPanel onClose={() => setAuthOpen(false)} />}
    </>
  );
}
