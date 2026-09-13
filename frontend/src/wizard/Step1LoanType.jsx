import { useLang } from '../context/LangContext.jsx';
import { CATEGORIES } from './constants.js';

export default function Step1LoanType({ wizard, setWizard, settings, onContinue }) {
  const { t } = useLang();

  const select = (id) => {
    if (id === 'business' && !settings?.businessLoanEnabled) return;
    setWizard((w) => ({ ...w, loanCategory: id }));
  };

  return (
    <div className="fade-in">
      <h1 className="font-display font-bold text-2xl mb-1">{t('step1Title')}</h1>
      <p className="mb-6" style={{ color: 'var(--color-text-600)' }}>{t('step1Sub')}</p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
        {CATEGORIES.map((cat) => {
          const disabled = cat.id === 'business' && !settings?.businessLoanEnabled;
          const selected = wizard.loanCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              disabled={disabled}
              onClick={() => select(cat.id)}
              className={`choice-card p-5 flex flex-col items-center gap-2 text-center ${selected ? 'selected' : ''} ${disabled ? 'disabled-card' : ''}`}
            >
              <i className={`fa-solid ${cat.icon} text-xl`} style={{ color: 'var(--color-teal-700)' }} />
              <span className="font-semibold text-sm">{cat.label}</span>
              {disabled && <span className="badge badge-grey">Coming soon</span>}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        disabled={!wizard.loanCategory}
        onClick={onContinue}
        className="btn-primary rounded-lg h-12 px-8"
      >
        {t('continue')}
      </button>
    </div>
  );
}
