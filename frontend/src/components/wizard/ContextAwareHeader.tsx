'use client';

import { useWizardStore } from '@/store/wizardStore';
import { Header } from './Header';
import { ContextChip } from './ContextChip';

export function ContextAwareHeader() {
  const step = useWizardStore((s) => s.step);
  return (
    <>
      <Header />
      {step > 1 && <ContextChip />}
    </>
  );
}
