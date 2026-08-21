'use client';

import { useTranslation } from 'react-i18next';
import { Briefcase, Building2, Car, Home, User } from 'lucide-react';
import type { LoanCategory } from '@wabyloan/engine';
import { useWizardStore } from '@/store/wizardStore';
import { usePublicSettings } from '@/hooks/useReferenceData';
import { ChoiceCard } from '@/components/ui/ChoiceCard';
import { Badge } from '@/components/ui/Badge';

const CATEGORIES: { id: LoanCategory; icon: React.ReactNode }[] = [
  { id: 'personal', icon: <User size={22} className="text-teal-700" /> },
  { id: 'professional', icon: <Briefcase size={22} className="text-teal-700" /> },
  { id: 'housing', icon: <Home size={22} className="text-teal-700" /> },
  { id: 'vehicle', icon: <Car size={22} className="text-teal-700" /> },
  { id: 'business', icon: <Building2 size={22} className="text-teal-700" /> },
];

export function Step1LoanCategory() {
  const { t } = useTranslation();
  const loanCategory = useWizardStore((s) => s.loanCategory);
  const setField = useWizardStore((s) => s.setField);
  const setStep = useWizardStore((s) => s.setStep);
  const { data: settings } = usePublicSettings();

  function select(id: LoanCategory) {
    if (id === 'business' && settings && !settings.businessLoanEnabled) return;
    setField('loanCategory', id);
    setStep(2);
  }

  return (
    <div className="fade-in">
      <h1 className="font-display text-2xl font-bold text-text-900">{t('step1Title')}</h1>
      <p className="mt-1 text-[14px] text-text-600">{t('step1Sub')}</p>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {CATEGORIES.map((cat) => {
          const disabled = cat.id === 'business' && !!settings && !settings.businessLoanEnabled;
          return (
            <ChoiceCard
              key={cat.id}
              icon={cat.icon}
              title={t(`loanCategory.${cat.id}`)}
              selected={loanCategory === cat.id}
              disabled={disabled}
              onClick={() => select(cat.id)}
              badge={disabled ? <Badge tone="amber">Coming Soon</Badge> : undefined}
            />
          );
        })}
      </div>
    </div>
  );
}
