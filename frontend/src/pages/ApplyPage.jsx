import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import Stepper from '../components/Stepper.jsx';
import Step1LoanType from '../wizard/Step1LoanType.jsx';
import Step2Profile from '../wizard/Step2Profile.jsx';
import Step3Income from '../wizard/Step3Income.jsx';
import Step4LoanDetails from '../wizard/Step4LoanDetails.jsx';
import Step5Results from '../wizard/Step5Results.jsx';
import { initialWizardState } from '../wizard/constants.js';

function buildEligibilityPayload(wizard) {
  return {
    loanCategory: wizard.loanCategory,
    sector: wizard.sector,
    occupation: wizard.occupation,
    applicant: wizard.applicant,
    employerName: wizard.employerName,
    employmentMonths: wizard.employmentMonths,
    otMonthlyAverage: wizard.otMonthlyAverage,
    otherIncomeMonthly: wizard.otherIncomeMonthly,
    business: wizard.business,
    pensionIncome: wizard.pensionIncome,
    selfEmployedIncome: wizard.selfEmployedIncome,
    payslip: wizard.payslip,
    vehicle: wizard.vehicle,
    housing: wizard.housing,
    termYears: wizard.termYears,
    requestedAmount: wizard.requestedAmount,
    existingObligations: wizard.hasExistingObligations ? wizard.existingObligations : 0,
    settleExistingLoans: wizard.settleExistingLoans,
    existingLoanBalance: wizard.existingLoanBalance,
  };
}

export default function ApplyPage() {
  const [step, setStep] = useState(1);
  const [wizard, setWizard] = useState(initialWizardState());
  const [settings, setSettings] = useState(null);
  const [eligibility, setEligibility] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/settings/public').then(({ data }) => setSettings(data));
  }, []);

  const goToResults = async () => {
    setBusy(true);
    setError('');
    try {
      const { data } = await api.post('/eligibility/compute', buildEligibilityPayload(wizard));
      setEligibility(data);
      setStep(5);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err?.response?.data?.error || 'Could not calculate eligibility. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const back = () => setStep((s) => Math.max(1, s - 1));
  const next = () => {
    setStep((s) => s + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Stepper current={step} />
      {error && <p className="mb-4 text-sm" style={{ color: 'var(--color-danger)' }}>{error}</p>}

      {step === 1 && <Step1LoanType wizard={wizard} setWizard={setWizard} settings={settings} onContinue={next} />}
      {step === 2 && <Step2Profile wizard={wizard} setWizard={setWizard} settings={settings} onBack={back} onContinue={next} />}
      {step === 3 && <Step3Income wizard={wizard} setWizard={setWizard} onBack={back} onContinue={next} />}
      {step === 4 && <Step4LoanDetails wizard={wizard} setWizard={setWizard} onBack={back} onContinue={goToResults} busy={busy} />}
      {step === 5 && <Step5Results wizard={wizard} eligibility={eligibility} onBack={() => setStep(4)} />}
    </div>
  );
}
