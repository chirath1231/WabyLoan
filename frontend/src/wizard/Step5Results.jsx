import { useState } from 'react';
import { useLang } from '../context/LangContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import BankResultCard from './BankResultCard.jsx';
import CompareModal from './CompareModal.jsx';
import BankDetailModal from './BankDetailModal.jsx';
import SoftLeadForm from './SoftLeadForm.jsx';

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
  const sponsored = eligibleResults.filter((r) => r.bank.sponsored);
  const regular = eligibleResults.filter((r) => !r.bank.sponsored);
  const bestKey = eligibleResults[0]?.variantKey;

  const toggleCompare = (key) => {
    setSelected((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  };

  const whatsappShare = () => {
    const top = eligibleResults[0];
    const text = top
      ? `I compared loan offers on Waby Loan — best offer: ${top.bank.name} at ${top.rate}%, up to LKR ${Math.round(top.maxLoan).toLocaleString('en-LK')}.`
      : 'Check out Waby Loan for comparing Sri Lankan bank loan offers.';
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const shouldBlur = (index) => isRestricted && index >= 2;

  const applicantSnapshot = wizard;
  const selectedResults = results.filter((r) => selected.includes(r.variantKey));

  return (
    <div className="pb-24">
      {/* Fixed-position children (modals, bottom bars) must stay OUTSIDE this
          fade-in wrapper: the fadeIn keyframes end on transform:translateY(0),
          and any non-'none' computed transform on an ancestor — even a no-op
          one — creates a new containing block for position:fixed descendants,
          pinning them to this div's box instead of the viewport. */}
      <div className="fade-in">
      <h1 className="font-display font-bold text-2xl mb-1">{t('step5Title')}</h1>
      <p className="mb-6" style={{ color: 'var(--color-text-600)' }}>
        {eligibleResults.length} eligible offer{eligibleResults.length === 1 ? '' : 's'} found across {results.length} products checked.
      </p>

      {sponsored.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold text-sm mb-2" style={{ color: 'var(--color-text-600)' }}>Sponsored</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sponsored.map((r) => (
              <BankResultCard
                key={r.variantKey} result={r} isBest={r.variantKey === bestKey}
                isSelected={selected.includes(r.variantKey)} onToggleCompare={() => toggleCompare(r.variantKey)}
                onViewDetails={() => setDetailResult(r)}
              />
            ))}
          </div>
        </div>
      )}

      {eligibleResults.length === 0 ? (
        <div className="card p-8 text-center mb-6">
          <p className="mb-4" style={{ color: 'var(--color-text-600)' }}>No eligible offers found based on your answers. Talk to a consultant instead.</p>
          <SoftLeadForm category={wizard.loanCategory} bankId={null} />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {regular.map((r, i) => (
            <BankResultCard
              key={r.variantKey} result={r} isBest={r.variantKey === bestKey}
              isSelected={selected.includes(r.variantKey)} onToggleCompare={() => toggleCompare(r.variantKey)}
              onViewDetails={() => setDetailResult(r)} blurred={shouldBlur(i)}
            />
          ))}
        </div>
      )}

      {ineligibleResults.length > 0 && (
        <details className="mb-6">
          <summary className="text-sm font-semibold cursor-pointer" style={{ color: 'var(--color-text-600)' }}>
            {ineligibleResults.length} not eligible — show anyway
          </summary>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-3">
            {ineligibleResults.map((r) => (
              <BankResultCard key={r.variantKey} result={r} isBest={false} isSelected={false} onToggleCompare={() => {}} onViewDetails={() => {}} />
            ))}
          </div>
        </details>
      )}

      {eligibleResults.length > 0 && (
        <div className="card p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <p className="text-sm font-semibold">Want to talk it through with someone?</p>
            <div className="flex gap-2">
              <button onClick={whatsappShare} className="btn-whatsapp rounded-lg h-10 px-4 text-sm"><i className="fa-brands fa-whatsapp mr-1" />{t('sendWhatsapp')}</button>
            </div>
          </div>
          <div className="mt-3">
            <SoftLeadForm category={wizard.loanCategory} bankId={null} />
          </div>
        </div>
      )}
      </div>

      {isRestricted && eligibleResults.length > 2 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t p-4" style={{ background: 'var(--color-card)', borderColor: 'var(--color-line)' }}>
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center gap-3 justify-between">
            <div>
              <p className="font-semibold text-sm">{t('guestLockTitle')}</p>
              <p className="hint">{t('guestLockSub')}</p>
            </div>
            <button onClick={() => openAuthPanel('signup')} className="btn-primary rounded-lg h-10 px-5 whitespace-nowrap">{t('signUpUnlock')}</button>
          </div>
        </div>
      )}

      {selected.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-30 border-t p-3" style={{ background: 'var(--color-card)', borderColor: 'var(--color-line)' }}>
          <div className="max-w-4xl mx-auto flex justify-end">
            <button onClick={() => setCompareOpen(true)} className="btn-primary rounded-lg h-10 px-5">
              {t('compareSelected')} ({selected.length})
            </button>
          </div>
        </div>
      )}

      {compareOpen && <CompareModal results={selectedResults} onClose={() => setCompareOpen(false)} />}
      {detailResult && (
        <BankDetailModal
          result={detailResult} category={wizard.loanCategory}
          applicantSnapshot={applicantSnapshot} onClose={() => setDetailResult(null)}
        />
      )}

      <div className="mt-2">
        <button type="button" onClick={onBack} className="btn-ghost rounded-lg h-11 px-6">{t('back')}</button>
      </div>

      <p className="hint mt-8 max-w-2xl">{t('footerDisclaimer')}</p>
      <p className="hint mt-1 max-w-2xl">{t('footerPrivacy')}</p>
    </div>
  );
}
