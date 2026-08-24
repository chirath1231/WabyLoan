'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { LoanCategory } from '@wabyloan/engine';
import { api } from '@/lib/apiClient';
import { Button } from '@/components/ui/Button';
import { TextInput, Hint } from '@/components/ui/Field';

const PHONE_RE = /^0\d{9}$/;

export function CallbackForm({ loanCategory, applicationId }: { loanCategory: LoanCategory; applicationId: string | null }) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const valid = name.trim().length > 0 && PHONE_RE.test(phone);

  async function submit() {
    if (!valid) return;
    setStatus('sending');
    try {
      await api.post('/leads/callback', { name, phone, loanCategory, applicationId: applicationId ?? undefined });
      setStatus('sent');
    } catch {
      setStatus('error');
    }
  }

  if (status === 'sent') {
    return <p className="rounded-xl border border-teal-100 bg-teal-50 p-3 text-sm font-semibold text-teal-800">Thanks — we&apos;ll call you back shortly.</p>;
  }

  return (
    <div className="flex flex-wrap items-end gap-2 rounded-xl2 border border-line bg-card p-3">
      <div className="w-40">
        <TextInput placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="w-36">
        <TextInput placeholder="07XXXXXXXX" value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>
      <Button onClick={submit} disabled={!valid || status === 'sending'}>
        {t('requestCallback')}
      </Button>
      {status === 'error' && <Hint tone="danger">Something went wrong — try again.</Hint>}
    </div>
  );
}
