'use client';

import { useTranslation } from 'react-i18next';
import { useWizardStore } from '@/store/wizardStore';

export function ContextChip() {
  const { t } = useTranslation();
  const loanCategory = useWizardStore((s) => s.loanCategory);
  const sector = useWizardStore((s) => s.sector);
  const occupationId = useWizardStore((s) => s.occupationId);

  if (!loanCategory) return null;

  const parts = [
    t(`loanCategory.${loanCategory}`),
    sector ? t(`sector.${sector}`) : null,
    occupationId && occupationId !== 'general' ? occupationId : null,
  ].filter(Boolean);

  return (
    <div className="border-b border-line bg-teal-50/60">
      <div className="mx-auto max-w-6xl px-4 py-2 sm:px-6">
        <p className="text-[12px] font-semibold text-teal-800">{parts.join(' · ')}</p>
      </div>
    </div>
  );
}
