import { useLang } from '../context/LangContext.jsx';

// Every card comes from master_loan_categories (via /master-data), in the admin's sort order, as in
// renderStep1() of waby-loan.html. A category that isn't enabled stays visible but frozen with COMING SOON.
const SAFE_ICON = /^fa-[a-z0-9-]+$/;

export default function Step1LoanType({ wizard, setWizard, masterData, onContinue }) {
  const { t } = useLang();
  const categories = masterData?.loanCategories || [];

  return (
    <section className="card p-6 sm:p-8 fade-in">
      <h2 className="font-display text-xl font-bold" style={{ color: 'var(--color-teal-900)' }}>{t('step1Title')}</h2>
      <p className="text-sm mt-1" style={{ color: 'var(--color-text-600)' }}>{t('step1Sub')}</p>

      <div className="grid sm:grid-cols-2 gap-4 mt-6">
        {!masterData && [0, 1, 2, 3].map((i) => <div key={i} className="skeleton rounded-[14px] h-[88px]" />)}
        {categories.map((cat) => {
          const disabled = !cat.enabled;
          const selected = wizard.loanCategory === cat.id;
          const icon = SAFE_ICON.test(cat.iconClass || '') ? cat.iconClass : 'fa-sack-dollar';
          return (
            <button
              key={cat.id}
              type="button"
              disabled={disabled}
              aria-disabled={disabled}
              onClick={() => setWizard((w) => ({ ...w, loanCategory: cat.id }))}
              className={`choice-card p-5 flex items-start gap-4 text-left ${selected ? 'selected' : ''} ${disabled ? 'disabled-card' : ''}`}
            >
              <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'var(--color-teal-100)', color: 'var(--color-teal-700)' }}>
                <i className={`fa-solid ${icon}`} />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-[15px]">{cat.label}</p>
                  {disabled && <span className="badge badge-grey">COMING SOON</span>}
                </div>
                {cat.description && <p className="text-[13px] mt-0.5" style={{ color: 'var(--color-text-600)' }}>{cat.description}</p>}
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex justify-end mt-8">
        <button type="button" disabled={!wizard.loanCategory} onClick={onContinue} className="btn-primary px-6 py-2.5 rounded-xl text-sm">
          {t('continue')} <i className="fa-solid fa-arrow-right ml-1.5 text-xs" />
        </button>
      </div>
    </section>
  );
}
