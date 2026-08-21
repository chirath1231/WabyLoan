'use client';

import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';
import { cn } from '@/lib/cn';

const STEP_KEYS = ['step1', 'step2', 'step3', 'step4', 'step5'] as const;

export function Stepper({ current }: { current: number }) {
  const { t } = useTranslation();
  return (
    <div className="mb-6 flex items-center gap-1 overflow-x-auto py-2">
      {STEP_KEYS.map((key, i) => {
        const stepNum = i + 1;
        const done = stepNum < current;
        const active = stepNum === current;
        return (
          <div key={key} className="flex flex-1 items-center gap-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border-2 font-display text-[15px] font-bold transition-all',
                  done
                    ? 'border-teal-700 bg-teal-700 text-white'
                    : active
                      ? 'border-teal-700 text-teal-700 shadow-[0_0_0_4px_rgba(220,239,236,1)]'
                      : 'border-line bg-white text-text-400',
                )}
              >
                {done ? <Check size={16} /> : stepNum}
              </div>
              <span className={cn('whitespace-nowrap text-[11px] font-semibold', active ? 'text-teal-700' : 'text-text-400')}>
                {t(key)}
              </span>
            </div>
            {stepNum < STEP_KEYS.length && (
              <div className="relative h-0.5 min-w-[12px] flex-1 bg-line">
                <div className="absolute inset-0 origin-left bg-teal-700 transition-transform" style={{ transform: `scaleX(${done ? 1 : 0})` }} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
