import { useLang } from '../context/LangContext.jsx';
import { fmt } from '../utils/money.js';

const COLLATERAL_LABELS = { vehicle: '🔒 Vehicle Collateral', property: '🔒 Property Collateral', fd: '🔒 Fixed Deposit Collateral' };

// Layout and badge rules follow bankCardMarkup() in waby-loan.html: rank pill + name + at most 3
// status badges (most decision-relevant first), then four stat tiles.
function badgesFor(result, isBest, t) {
  return [
    isBest && <span key="best" className="badge badge-gold"><i className="fa-solid fa-crown mr-1" />{t('bestOffer')}</span>,
    result.netCashInHand != null && result.netCashInHand < 0 && (
      <span key="short" className="badge badge-amber">⚠️ Shortfall: {fmt(Math.abs(result.netCashInHand))} needed to fully settle debt</span>
    ),
    result.isPreferredEmployer && (
      <span key="pref" className="badge" style={{ background: '#16A34A', color: '#fff' }}><i className="fa-solid fa-star mr-1" />Preferred Employer</span>
    ),
    result.schemeApplied && <span key="scheme" className="badge badge-violet">Professional Scheme</span>,
    result.promotional && <span key="promo" className="badge badge-danger">🔥 Promotional Rate</span>,
    result.cappedByAsset && <span key="cap" className="badge badge-grey">Capped by Down Payment</span>,
    result.bank.type === 'finance' && <span key="fin" className="badge badge-amber">Finance Co.</span>,
  ].filter(Boolean).slice(0, 3);
}

function glowClass(result, isBest) {
  if (isBest) return 'best-glow';
  if (result.isPreferredEmployer) return 'preferred-glow';
  if (result.schemeApplied) return 'scheme-glow';
  if (result.bank.sponsored) return 'sponsor-glow';
  return '';
}

function StatTile({ label, children, accent }) {
  return (
    <div className="stat-tile p-3 sm:p-4">
      <p className="text-[9px] sm:text-[10px] font-semibold leading-tight uppercase" style={{ color: 'var(--color-text-400)' }}>{label}</p>
      <p className="font-mono font-bold text-[16px] sm:text-[20px] mt-1 leading-tight" style={{ color: accent ? 'var(--color-teal-700)' : 'var(--color-text-900)' }}>
        {children}
      </p>
    </div>
  );
}

export default function BankResultCard({ result, rank, isBest, isSelected, compareDisabled, onToggleCompare, onViewDetails, blurred, onUnlock }) {
  const { t } = useLang();
  const b = result.bank;

  if (result.ineligible) {
    return (
      <div className="card p-4 flex flex-wrap items-center justify-between gap-3" style={{ opacity: 0.7 }}>
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: b.color || 'var(--color-line)' }} />
          <div>
            <p className="font-semibold text-sm">{b.name}{result.variantLabel ? ` — ${result.variantLabel}` : ''}</p>
            <p className="text-[12.5px] mt-0.5" style={{ color: 'var(--color-text-600)' }}>{result.reason}</p>
          </div>
        </div>
        <span className="badge badge-grey">{result.shortReason || t('notEligible')}</span>
      </div>
    );
  }

  const collateral = COLLATERAL_LABELS[result.collateralRequired];

  return (
    <div
      className={`card p-5 ${glowClass(result, isBest)} ${blurred ? 'guest-lock-card cursor-pointer' : ''}`}
      onClick={blurred ? onUnlock : undefined}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          {rank != null && <span className="rank-pill">{rank}</span>}
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-display font-bold text-[16px]" style={{ color: 'var(--color-text-900)', filter: blurred ? 'blur(5px)' : undefined }}>
                {b.name}{result.variantLabel ? ` — ${result.variantLabel}` : ''}
              </p>
              {blurred
                ? <span className="badge badge-grey"><i className="fa-solid fa-lock mr-1" />Locked (Click to unlock)</span>
                : badgesFor(result, isBest, t)}
            </div>
            {collateral && !blurred && <div className="flex items-center gap-2 flex-wrap mt-1.5"><span className="badge badge-grey">{collateral}</span></div>}
          </div>
        </div>
        {!blurred && (
          <button type="button" onClick={onViewDetails} className="btn-primary px-4 py-2 rounded-xl text-[13px] flex-shrink-0">
            {t('viewDetails')}
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mt-3">
        <StatTile label={`${t('maxLoan')}${result.cappedByRequest ? ' (Your Target)' : ''}`} accent>{fmt(result.maxLoan)}</StatTile>
        <div className="stat-tile p-3 sm:p-4">
          <div className="flex items-center justify-between gap-1 flex-wrap">
            <p className="text-[9px] sm:text-[10px] font-semibold leading-tight uppercase" style={{ color: 'var(--color-text-400)' }}>{t('interestRate')}</p>
            {result.rateType && !blurred && (
              <span className={`badge ${result.rateType === 'variable' ? 'badge-variable' : 'badge-fixed'}`}>
                {result.rateType === 'variable' ? 'Variable' : 'Fixed'}
              </span>
            )}
          </div>
          <p className="font-mono font-bold text-[16px] sm:text-[20px] mt-1 leading-tight">
            {blurred ? <span className="text-[13px]" style={{ color: 'var(--color-text-400)' }}>Rate hidden</span> : `${result.rate.toFixed(2)}%`}
          </p>
          {result.benchmark && !blurred && (
            <p className="text-[10.5px] mt-1" style={{ color: 'var(--color-text-400)' }}>
              {result.benchmark.label} {result.benchmark.rate.toFixed(2)}% + {result.benchmark.margin.toFixed(2)}% margin
            </p>
          )}
        </div>
        <StatTile label={t('monthlyEmi')}>{fmt(result.emi)}</StatTile>
        <StatTile label={t('totalCost')}>{blurred ? '—' : fmt(result.totalCostOfCredit)}</StatTile>
      </div>

      {result.downPayment > 0 && !blurred && (
        <p className="text-[12px] mt-3" style={{ color: 'var(--color-text-600)' }}>
          Requires approx. <span className="font-mono font-semibold">{fmt(result.downPayment)}</span> down payment
          {result.legalFee > 0 && <> + <span className="font-mono font-semibold">{fmt(result.legalFee)}</span> legal &amp; valuation fee</>}.
        </p>
      )}
      {result.netCashInHand != null && !blurred && (
        <div className="stat-tile p-3 mt-3 text-[12.5px]" style={{ color: result.netCashInHand >= 0 ? 'var(--color-teal-700)' : 'var(--color-danger)' }}>
          Net cash in hand after settling existing loans: <span className="font-mono font-bold">{fmt(result.netCashInHand)}</span>
        </div>
      )}
      {result.remarks?.length > 0 && !blurred && (
        <p className="text-[11.5px] mt-2" style={{ color: 'var(--color-text-400)' }}>{result.remarks.join(' · ')}</p>
      )}

      {!blurred && (
        <div className="flex flex-wrap items-center justify-end gap-2 mt-3">
          <label className="flex items-center gap-1.5 text-[12px] font-semibold" style={{ color: 'var(--color-teal-700)' }}>
            <input
              type="checkbox" className="w-3.5 h-3.5" style={{ accentColor: 'var(--color-teal-700)' }}
              checked={isSelected} disabled={!isSelected && compareDisabled} onChange={onToggleCompare}
            />
            + Compare
          </label>
        </div>
      )}
    </div>
  );
}
