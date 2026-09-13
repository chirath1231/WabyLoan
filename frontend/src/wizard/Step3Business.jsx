import { useLang } from '../context/LangContext.jsx';
import MoneyInput from '../components/MoneyInput.jsx';
import { fmt } from '../utils/money.js';

export default function Step3Business({ wizard, setWizard, onBack, onContinue }) {
  const { t } = useLang();
  const net = (wizard.business.revenue || 0) - (wizard.business.expenses || 0);
  const canContinue = wizard.business.revenue > 0;

  const setBusiness = (patch) => setWizard((w) => ({ ...w, business: { ...w.business, ...patch } }));

  return (
    <div className="fade-in">
      <h1 className="font-display font-bold text-2xl mb-1">{t('step3Title')}</h1>
      <p className="mb-6" style={{ color: 'var(--color-text-600)' }}>Tell us about your average monthly business income.</p>

      <div className="grid sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="field-label">Average monthly revenue</label>
          <MoneyInput value={wizard.business.revenue} onChange={(v) => setBusiness({ revenue: v })} />
        </div>
        <div>
          <label className="field-label">Average monthly expenses</label>
          <MoneyInput value={wizard.business.expenses} onChange={(v) => setBusiness({ expenses: v })} />
        </div>
      </div>

      <div className="card p-4 mb-6">
        <span className="text-sm" style={{ color: 'var(--color-text-600)' }}>Net monthly income</span>
        <div className="font-mono font-bold text-xl">{fmt(net)}</div>
      </div>

      <div className="flex gap-3">
        <button type="button" onClick={onBack} className="btn-ghost rounded-lg h-12 px-6">{t('back')}</button>
        <button type="button" disabled={!canContinue} onClick={onContinue} className="btn-primary rounded-lg h-12 px-8">{t('continue')}</button>
      </div>
    </div>
  );
}
