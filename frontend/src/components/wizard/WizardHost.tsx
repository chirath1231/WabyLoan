'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useWizardStore } from '@/store/wizardStore';
import { Stepper } from './Stepper';
import { Step1LoanCategory } from './Step1LoanCategory';
import { Step2Profile } from './Step2Profile';
import { Step3Income } from './Step3Income';
import { Step4Details } from './Step4Details';
import { Step5Results } from './Step5Results';

const LAST_STEP = 5;

const navButtonClass =
  'fixed top-1/2 z-30 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-card text-text-600 shadow-md transition-colors hover:border-teal-600 hover:text-teal-700 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-40 sm:h-11 sm:w-11';

export function WizardHost() {
  const step = useWizardStore((s) => s.step);
  const setStep = useWizardStore((s) => s.setStep);
  const loanCategory = useWizardStore((s) => s.loanCategory);
  const canGoNext = useWizardStore((s) => s.canGoNext);

  const canBack = step > 1;
  const canNext = step < LAST_STEP && (step === 1 ? Boolean(loanCategory) : canGoNext);

  return (
    <div>
      <button
        type="button"
        aria-label="Previous step"
        onClick={() => setStep(step - 1)}
        disabled={!canBack}
        className={`${navButtonClass} left-2 sm:left-4`}
      >
        <ChevronLeft size={20} />
      </button>
      <button
        type="button"
        aria-label="Next step"
        onClick={() => setStep(step + 1)}
        disabled={!canNext}
        className={`${navButtonClass} right-2 sm:right-4`}
      >
        <ChevronRight size={20} />
      </button>

      <Stepper current={step} />
      {step === 1 && <Step1LoanCategory />}
      {step === 2 && <Step2Profile onContinue={() => setStep(3)} onBack={() => setStep(1)} />}
      {step === 3 && <Step3Income onContinue={() => setStep(4)} onBack={() => setStep(2)} />}
      {step === 4 && <Step4Details onContinue={() => setStep(5)} onBack={() => setStep(3)} />}
      {step === 5 && <Step5Results onBack={() => setStep(4)} />}
    </div>
  );
}
