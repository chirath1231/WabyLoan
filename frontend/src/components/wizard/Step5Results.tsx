'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { EligibilityResult } from '@wabyloan/engine';
import { Lock } from 'lucide-react';
import { useWizardStore } from '@/store/wizardStore';
import { useEvaluateEligibility } from '@/hooks/useEligibility';
import { buildEligibilityInput } from '@/lib/buildEligibilityInput';
import { fmtLkr } from '@/lib/format';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Slider } from '@/components/ui/Slider';
import { Label } from '@/components/ui/Field';
import { CallbackForm } from './CallbackForm';
import { BankDetailModal } from './BankDetailModal';
import { CompareBar } from './CompareBar';
import { CompareModal } from './CompareModal';

const MAX_COMPARE = 3;

const TERM_BOUNDS: Record<string, [number, number]> = {
  personal: [1, 8],
  professional: [1, 8],
  vehicle: [1, 7],
  business: [1, 7],
  housing: [5, 30],
};

function BankCard({
  result,
  rank,
  restricted,
  onView,
  compareChecked,
  compareDisabled,
  onToggleCompare,
}: {
  result: EligibilityResult;
  rank?: number;
  restricted: boolean;
  onView: () => void;
  compareChecked?: boolean;
  compareDisabled?: boolean;
  onToggleCompare?: () => void;
}) {
  const { t } = useTranslation();
  const isBest = rank === 1;
  const blurred = restricted;

  return (
    <div
      className={`rounded-2xl border bg-card p-4 ${isBest ? 'border-teal-700' : 'border-line'}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {rank && (
            <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-teal-100 font-display text-[13px] font-bold text-teal-800">
              {rank}
            </span>
          )}
          <div>
            <div className="flex flex-wrap items-center gap-1.5">
              <p className="font-display font-semibold text-text-900">{result.bankName}</p>
              {isBest && <Badge tone="teal">{t('bestOffer')}</Badge>}
              {result.sponsored && <Badge tone="grey">Sponsored</Badge>}
              {result.variantLabel && <Badge tone="grey">{result.variantLabel}</Badge>}
            </div>
            <Badge tone="teal" className="mt-1">
              {t('ratesEffective')}: {result.updatedDate} (Live)
            </Badge>
          </div>
        </div>
      </div>

      {result.ineligible ? (
        <p className="mt-3 rounded-lg bg-danger-100 p-2.5 text-[13px] text-danger">{result.ineligibleReason}</p>
      ) : (
        <>
          <div className={`mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-4 ${blurred ? 'select-none blur-sm' : ''}`}>
            <div>
              <p className="text-[11px] font-semibold uppercase text-text-400">{t('maxLoan')}</p>
              <p className="font-mono text-sm font-semibold tabular-nums">{fmtLkr(result.maxLoan)}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase text-text-400">{t('interestRate')}</p>
              <p className="font-mono text-sm font-semibold tabular-nums">{result.rate}%</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase text-text-400">{t('monthlyEmi')}</p>
              <p className="font-mono text-sm font-semibold tabular-nums">{fmtLkr(result.emi)}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase text-text-400">{t('totalCost')}</p>
              <p className="font-mono text-sm font-semibold tabular-nums">{fmtLkr(result.totalCostOfCredit)}</p>
            </div>
          </div>
          {result.termCapReason && (
            <p className="mt-2 text-[11.5px] text-text-400">
              Term shown at {result.termYears}yr ({result.termCapReason})
            </p>
          )}
          <div className="mt-3 flex items-center gap-2">
            {blurred ? (
              <div className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-dashed border-line py-2.5 text-[13px] font-semibold text-text-400">
                <Lock size={14} /> Sign up to unlock
              </div>
            ) : (
              <>
                <Button variant="ghost" onClick={onView} className="flex-1 justify-center">
                  {t('viewDetails')}
                </Button>
                {onToggleCompare && (
                  <label
                    className={`flex flex-shrink-0 items-center gap-1.5 rounded-xl border px-3 py-2.5 text-[12.5px] font-semibold ${
                      compareChecked ? 'border-teal-700 text-teal-700' : 'border-line text-text-600'
                    } ${compareDisabled && !compareChecked ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                  >
                    <input
                      type="checkbox"
                      className="h-3.5 w-3.5 accent-teal-700"
                      checked={!!compareChecked}
                      disabled={compareDisabled && !compareChecked}
                      onChange={onToggleCompare}
                    />
                    Compare
                  </label>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export function Step5Results({ onBack }: { onBack: () => void }) {
  const { t } = useTranslation();
  const state = useWizardStore();
  const setField = useWizardStore((s) => s.setField);
  const evaluate = useEvaluateEligibility();
  const [selected, setSelected] = useState<EligibilityResult | null>(null);
  const [term, setTerm] = useState(state.requestedTermYears);
  const [compareOpen, setCompareOpen] = useState(false);

  function toggleCompare(variantKey: string) {
    const current = state.compareSelection;
    const next = current.includes(variantKey)
      ? current.filter((k) => k !== variantKey)
      : current.length < MAX_COMPARE
        ? [...current, variantKey]
        : current;
    setField('compareSelection', next);
  }

  const bounds = TERM_BOUNDS[state.loanCategory ?? 'personal'] ?? [1, 8];

  function runEvaluation(overrideTerm?: number) {
    const input = buildEligibilityInput({ ...state, requestedTermYears: overrideTerm ?? term } as typeof state);
    evaluate.mutate(input, {
      onSuccess: (data) => {
        setField('engineResult', data.engineResult);
        setField('restricted', data.restricted);
        setField('applicationId', data.applicationId);
      },
    });
  }

  useEffect(() => {
    runEvaluation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const results = state.engineResult?.results ?? [];
  const eligible = results.filter((r) => !r.ineligible);
  const ineligible = results.filter((r) => r.ineligible);
  const compareResults = eligible.filter((r) => state.compareSelection.includes(r.variantKey));

  const sponsoredSeen = new Set<string>();
  const sponsoredStrip = state.restricted
    ? []
    : eligible.filter((r) => {
        if (!r.sponsored || sponsoredSeen.has(r.bankId)) return false;
        sponsoredSeen.add(r.bankId);
        return true;
      });

  return (
    <div className={`fade-in space-y-6 ${compareResults.length > 0 ? 'pb-20' : ''}`}>
      <div>
        <h1 className="font-display text-2xl font-bold text-text-900">{t('step5Title')}</h1>
      </div>

      {state.restricted && (
        <div className="rounded-xl2 border border-line bg-teal-50 p-4 text-center">
          <p className="font-display font-semibold text-teal-800">{t('guestLockTitle')}</p>
          <p className="mt-1 text-[13px] text-text-600">{t('guestLockSub')}</p>
        </div>
      )}

      <div className="rounded-xl2 border border-line bg-card p-4">
        <Label>Loan term preference: {term} years</Label>
        <Slider value={term} min={bounds[0]} max={bounds[1]} onValueChange={setTerm} onValueCommit={(v) => runEvaluation(v)} />
      </div>

      {/* Available even to guests (SRS §6.2) — captures consultative intent regardless of auth state. */}
      <div>
        <p className="mb-2 text-sm font-semibold text-text-900">Not ready to compare details? Request a callback instead:</p>
        <CallbackForm loanCategory={state.loanCategory!} applicationId={state.applicationId} />
      </div>

      {evaluate.isPending && <p className="text-sm text-text-600">Calculating your eligibility…</p>}

      {sponsoredStrip.length > 0 && (
        <div>
          <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-text-400">Featured Partners</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {sponsoredStrip.map((r) => (
              <BankCard key={r.variantKey} result={r} restricted={false} onView={() => setSelected(r)} />
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        {eligible.map((r, i) => (
          <BankCard
            key={r.variantKey}
            result={r}
            rank={i + 1}
            restricted={state.restricted}
            onView={() => setSelected(r)}
            compareChecked={state.compareSelection.includes(r.variantKey)}
            compareDisabled={state.compareSelection.length >= MAX_COMPARE}
            onToggleCompare={state.restricted ? undefined : () => toggleCompare(r.variantKey)}
          />
        ))}
      </div>

      {!state.restricted && ineligible.length > 0 && (
        <div className="space-y-3">
          <p className="mb-1 text-[12px] font-semibold uppercase tracking-wide text-text-400">{t('notEligible')}</p>
          {ineligible.map((r) => (
            <BankCard key={r.variantKey} result={r} restricted={false} onView={() => setSelected(r)} />
          ))}
        </div>
      )}

      <div className="flex justify-between pt-2">
        <Button variant="ghost" onClick={onBack}>
          {t('back')}
        </Button>
      </div>

      {selected && !state.restricted && (
        <BankDetailModal result={selected} loanCategory={state.loanCategory!} applicationId={state.applicationId} onClose={() => setSelected(null)} />
      )}

      {!state.restricted && (
        <CompareBar
          count={compareResults.length}
          onCompare={() => setCompareOpen(true)}
          onClear={() => setField('compareSelection', [])}
        />
      )}
      {compareOpen && compareResults.length > 0 && <CompareModal results={compareResults} onClose={() => setCompareOpen(false)} />}
    </div>
  );
}
