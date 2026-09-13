import { useLang } from '../context/LangContext.jsx';
import { fmt } from '../utils/money.js';

export default function BankResultCard({ result, isBest, isSelected, onToggleCompare, onViewDetails, blurred }) {
  const { t } = useLang();
  const b = result.bank;

  return (
    <div
      className={`card p-4 flex flex-col gap-3 relative ${blurred ? 'pointer-events-none select-none' : ''}`}
      style={blurred ? { filter: 'blur(5px)' } : undefined}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="w-9 h-9 rounded-full flex items-center justify-center font-display font-bold text-xs text-white flex-shrink-0" style={{ background: b.color || 'var(--color-teal-700)' }}>
            {b.short?.slice(0, 3)}
          </span>
          <div>
            <div className="font-semibold text-sm leading-tight">{b.name}</div>
            {result.variantLabel && <div className="hint">{result.variantLabel}</div>}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          {b.sponsored && <span className="badge badge-gold">Sponsored</span>}
          {isBest && !result.ineligible && <span className="badge badge-teal">{t('bestOffer')}</span>}
        </div>
      </div>

      {result.ineligible ? (
        <div className="text-sm py-2" style={{ color: 'var(--color-text-400)' }}>
          <span className="badge badge-grey mb-1 inline-block">{t('notEligible')}</span>
          <p>{result.reason}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><div className="hint">{t('maxLoan')}</div><div className="font-mono font-semibold">{fmt(result.maxLoan)}</div></div>
            <div><div className="hint">{t('interestRate')}</div><div className="font-mono font-semibold">{result.rate}%</div></div>
            <div><div className="hint">{t('monthlyEmi')}</div><div className="font-mono font-semibold">{fmt(result.emi)}</div></div>
            <div><div className="hint">{t('totalCost')}</div><div className="font-mono font-semibold">{fmt(result.totalCostOfCredit)}</div></div>
          </div>

          <div className="flex items-center justify-between gap-2 pt-2 border-t" style={{ borderColor: 'var(--color-line)' }}>
            <label className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-text-600)' }}>
              <input type="checkbox" className="w-4 h-4" checked={isSelected} onChange={onToggleCompare} />
              Compare
            </label>
            <button type="button" onClick={onViewDetails} className="btn-ghost rounded-lg h-9 px-3 text-xs">
              {t('viewDetails')}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
