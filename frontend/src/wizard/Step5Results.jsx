import { useState } from 'react';
import { useLang } from '../context/LangContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { fmt } from '../utils/money.js';
import BankResultCard from './BankResultCard.jsx';
import CompareModal from './CompareModal.jsx';
import BankDetailModal from './BankDetailModal.jsx';
import SoftLeadForm from './SoftLeadForm.jsx';

const MAX_COMPARE = 3;
// Guests see this many eligible offers, identity blurred, as in the prototype's renderStep5Guest().
const GUEST_PREVIEW_COUNT = 4;

export default function Step5Results({ wizard, eligibility, onBack }) {
  const { t } = useLang();
  const { isRestricted, openAuthPanel } = useAuth();
  const [selected, setSelected] = useState([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const [detailResult, setDetailResult] = useState(null);

  if (!eligibility) return null;
  const { results } = eligibility;

  const eligibleResults = results.filter((r) => !r.ineligible);
  const ineligibleResults = results.filter((r) => r.ineligible);
  // Sponsored placement sits outside the ranked comparison: one card per bank, its cheapest variant.
  const sponsored = [];
  for (const r of eligibleResults) {
    if (r.bank.sponsored && !sponsored.some((s) => s.bank.id === r.bank.id)) sponsored.push(r);
  }
  const bestKey = eligibleResults[0]?.variantKey;
  const lowestEmi = [...eligibleResults].sort((a, b) => a.emi - b.emi)[0];
  const highestLoan = [...eligibleResults].sort((a, b) => b.maxLoan - a.maxLoan)[0];
  const visibleResults = isRestricted ? eligibleResults.slice(0, GUEST_PREVIEW_COUNT) : eligibleResults;

  const toggleCompare = (key) => {
    setSelected((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : prev.length >= MAX_COMPARE ? prev : [...prev, key]));
  };

  const whatsappShare = () => {
    const top = eligibleResults[0];
    const text = top
      ? `I compared loan offers on Waby Loan — best offer: ${top.bank.name} at ${top.rate.toFixed(2)}%, up to ${fmt(top.maxLoan)}.`
      : 'Check out Waby Loan for comparing Sri Lankan bank loan offers.';
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const selectedResults = results.filter((r) => selected.includes(r.variantKey));
  const unlock = () => openAuthPanel('signup');

  return (
    <div className="pb-28">
      {/* Fixed-position children (modals, bottom bars) must stay OUTSIDE this
          fade-in wrapper: the fadeIn keyframes end on transform:translateY(0),
          and any non-'none' computed transform on an ancestor — even a no-op
          one — creates a new containing block for position:fixed descendants,
          pinning them to this div's box instead of the viewport. */}
      <div className="fade-in">
        <section className="card p-6 sm:p-8 mb-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-xl font-bold" style={{ color: 'var(--color-teal-900)' }}>{t('step5Title')}</h2>
              <p className="text-sm mt-1" style={{ color: 'var(--color-text-600)' }}>
                {eligibleResults.length} eligible offer{eligibleResults.length === 1 ? '' : 's'} across {results.length} products checked
                {eligibility.dualSchemeMode && <> · <span style={{ color: 'var(--color-violet-700)' }}>Professional scheme rates included</span></>}
              </p>
            </div>
            <button type="button" onClick={onBack} className="btn-ghost px-4 py-2 rounded-xl text-sm">
              <i className="fa-solid fa-arrow-left mr-1.5 text-xs" />{t('back')}
            </button>
          </div>

          {eligibleResults.length > 0 && !isRestricted && (
            <div className="grid sm:grid-cols-2 gap-3 mt-5">
              <div className="stat-tile p-4">
                <p className="text-[10px] font-semibold uppercase" style={{ color: 'var(--color-text-400)' }}>🏆 Lowest EMI</p>
                <p className="font-semibold text-sm mt-1">{lowestEmi.bank.name}</p>
                <p className="font-mono font-bold text-lg" style={{ color: 'var(--color-teal-700)' }}>{fmt(lowestEmi.emi)}<span className="text-xs font-semibold"> / month</span></p>
              </div>
              <div className="stat-tile p-4">
                <p className="text-[10px] font-semibold uppercase" style={{ color: 'var(--color-text-400)' }}>💰 Highest Loan Amount</p>
                <p className="font-semibold text-sm mt-1">{highestLoan.bank.name}</p>
                <p className="font-mono font-bold text-lg" style={{ color: 'var(--color-teal-700)' }}>{fmt(highestLoan.maxLoan)}</p>
              </div>
            </div>
          )}
        </section>

        {sponsored.length > 0 && !isRestricted && (
          <div className="mb-5">
            <p className="text-[11px] font-bold tracking-wide mb-2" style={{ color: 'var(--color-text-400)' }}>
              FEATURED PARTNER — sponsored placement, not part of the ranked comparison
            </p>
            <div className="flex flex-col gap-4">
              {sponsored.map((r) => (
                <BankResultCard
                  key={`sp-${r.variantKey}`} result={r} isBest={false}
                  isSelected={selected.includes(r.variantKey)} compareDisabled={selected.length >= MAX_COMPARE}
                  onToggleCompare={() => toggleCompare(r.variantKey)} onViewDetails={() => setDetailResult(r)}
                />
              ))}
            </div>
          </div>
        )}

        {eligibleResults.length === 0 ? (
          <div className="card p-8 text-center mb-5">
            <i className={`fa-solid ${isRestricted ? 'fa-lock' : 'fa-headset'} text-3xl mb-3`} style={{ color: 'var(--color-teal-700)' }} />
            <p className="font-semibold mb-1">No banks currently match this profile</p>
            <p className="text-sm mb-4" style={{ color: 'var(--color-text-600)' }}>Talk to a consultant — they can often find options the calculator can't.</p>
            <SoftLeadForm category={wizard.loanCategory} bankId={null} />
          </div>
        ) : (
          <div className="flex flex-col gap-4 mb-5">
            {isRestricted && (
              <div className="card p-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-semibold"><i className="fa-solid fa-lock mr-2" style={{ color: 'var(--color-teal-700)' }} />{t('guestLockTitle')}</p>
                <button onClick={unlock} className="btn-primary px-4 py-2 rounded-xl text-sm">{t('signUpUnlock')}</button>
              </div>
            )}
            {visibleResults.map((r, i) => (
              <BankResultCard
                key={r.variantKey} result={r} rank={i + 1} isBest={r.variantKey === bestKey && !isRestricted}
                isSelected={selected.includes(r.variantKey)} compareDisabled={selected.length >= MAX_COMPARE}
                onToggleCompare={() => toggleCompare(r.variantKey)} onViewDetails={() => setDetailResult(r)}
                blurred={isRestricted} onUnlock={unlock}
              />
            ))}
          </div>
        )}

        {ineligibleResults.length > 0 && !isRestricted && (
          <div className="mb-5">
            <p className="text-[11px] font-bold tracking-wide mb-2" style={{ color: 'var(--color-text-400)' }}>NOT ELIGIBLE ({ineligibleResults.length})</p>
            <div className="flex flex-col gap-2">
              {ineligibleResults.map((r) => <BankResultCard key={`x-${r.variantKey}`} result={r} />)}
            </div>
          </div>
        )}

        {eligibleResults.length > 0 && (
          <div className="card p-5 mb-5">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              <div>
                <p className="font-semibold text-sm">Prefer to talk it through?</p>
                <p className="hint">A Waby consultant can walk you through these offers.</p>
              </div>
              <button onClick={whatsappShare} className="btn-whatsapp rounded-xl h-10 px-4 text-sm"><i className="fa-brands fa-whatsapp mr-1" />{t('sendWhatsapp')}</button>
            </div>
            <div className="mt-3">
              <SoftLeadForm category={wizard.loanCategory} bankId={null} />
            </div>
          </div>
        )}

        <p className="hint mt-8 max-w-2xl">{t('footerDisclaimer')}</p>
        <p className="hint mt-1 max-w-2xl">{t('footerPrivacy')}</p>
      </div>

      {isRestricted && eligibleResults.length > 0 && (
        <div id="guestUnlockBar" className="p-4">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center gap-3 justify-between text-white">
            <div>
              <p className="font-semibold text-sm">{t('guestLockTitle')}</p>
              <p className="text-[12px] opacity-80">{t('guestLockSub')}</p>
            </div>
            <button onClick={unlock} className="rounded-xl h-10 px-5 whitespace-nowrap font-semibold" style={{ background: '#fff', color: 'var(--color-teal-800)' }}>
              {t('signUpUnlock')}
            </button>
          </div>
        </div>
      )}

      {!isRestricted && selected.length >= 2 && (
        <div id="compareBar" className="p-3">
          <div className="max-w-4xl mx-auto flex flex-wrap items-center gap-2 justify-between">
            <div className="flex flex-wrap gap-2">
              {selectedResults.map((r) => (
                <span key={r.variantKey} className="badge badge-teal flex items-center gap-1.5" style={{ fontSize: 12 }}>
                  {r.bank.short}{r.variantLabel ? ` · ${r.variantLabel}` : ''}
                  <button type="button" aria-label="Remove" onClick={() => toggleCompare(r.variantKey)}><i className="fa-solid fa-xmark" /></button>
                </span>
              ))}
            </div>
            <button onClick={() => setCompareOpen(true)} className="btn-primary rounded-xl h-10 px-5 text-sm">
              {t('compareSelected')} ({selected.length})
            </button>
          </div>
        </div>
      )}

      {compareOpen && <CompareModal results={selectedResults} onClose={() => setCompareOpen(false)} />}
      {detailResult && (
        <BankDetailModal
          result={detailResult} category={wizard.loanCategory}
          applicantSnapshot={wizard} onClose={() => setDetailResult(null)}
        />
      )}
    </div>
  );
}
