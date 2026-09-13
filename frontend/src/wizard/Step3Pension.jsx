import { useLang } from '../context/LangContext.jsx';
import MoneyInput from '../components/MoneyInput.jsx';

export default function Step3Pension({ wizard, setWizard, onBack, onContinue }) {
  const { t } = useLang();
  const canContinue = wizard.pensionIncome > 0;

  return (
    <div className="fade-in">
      <h1 className="font-display font-bold text-2xl mb-1">{t('step3Title')}</h1>
      <p className="mb-6" style={{ color: 'var(--color-text-600)' }}>Enter your monthly pension income.</p>

      <div className="max-w-sm mb-6">
        <label className="field-label">Monthly pension income</label>
        <MoneyInput value={wizard.pensionIncome} onChange={(v) => setWizard((w) => ({ ...w, pensionIncome: v }))} />
      </div>

      <div className="flex gap-3">
        <button type="button" onClick={onBack} className="btn-ghost rounded-lg h-12 px-6">{t('back')}</button>
        <button type="button" disabled={!canContinue} onClick={onContinue} className="btn-primary rounded-lg h-12 px-8">{t('continue')}</button>
      </div>
    </div>
  );
}
