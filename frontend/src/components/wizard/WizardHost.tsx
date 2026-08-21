'use client';

import { useWizardStore } from '@/store/wizardStore';
import { Stepper } from './Stepper';
import { Step1LoanCategory } from './Step1LoanCategory';
import { Step2Profile } from './Step2Profile';
import { Step3Income } from './Step3Income';
import { Step4Details } from './Step4Details';
import { Step5Results } from './Step5Results';

export function WizardHost() {
  const step = useWizardStore((s) => s.step);
  const setStep = useWizardStore((s) => s.setStep);

  return (
    <div>
      <Stepper current={step} />
      {step === 1 && <Step1LoanCategory />}
      {step === 2 && <Step2Profile onContinue={() => setStep(3)} onBack={() => setStep(1)} />}
      {step === 3 && <Step3Income onContinue={() => setStep(4)} onBack={() => setStep(2)} />}
      {step === 4 && <Step4Details onContinue={() => setStep(5)} onBack={() => setStep(3)} />}
      {step === 5 && <Step5Results onBack={() => setStep(4)} />}
    </div>
  );
}
