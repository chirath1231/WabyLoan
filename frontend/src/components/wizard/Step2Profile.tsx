'use client';

import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { Sector } from '@wabyloan/engine';
import { useWizardStore } from '@/store/wizardStore';
import { useOccupations } from '@/hooks/useReferenceData';
import { ChoiceCard } from '@/components/ui/ChoiceCard';
import { Label, Hint, TextInput } from '@/components/ui/Field';
import { Select } from '@/components/ui/Select';
import { Switch } from '@/components/ui/Switch';
import { MoneyInput } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

const SECTORS: Sector[] = ['government', 'semi_government', 'private', 'self_employed'];
const DEFAULT_RETIREMENT: Record<Sector, number> = { government: 60, semi_government: 60, private: 60, self_employed: 65 };

export function Step2Profile({ onContinue, onBack }: { onContinue: () => void; onBack: () => void }) {
  const { t } = useTranslation();
  const state = useWizardStore();
  const setField = useWizardStore((s) => s.setField);
  const { data: occupations = [] } = useOccupations();

  useEffect(() => {
    if (state.sector && !state.retirementAgeCustom) {
      setField('retirementAge', DEFAULT_RETIREMENT[state.sector]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.sector]);

  const ageValid = state.age !== null && state.age >= 18 && state.age <= 70;
  const retirementValid = state.retirementAge !== null && state.retirementAge >= 18 && state.retirementAge <= 75;
  const bothValid = ageValid && retirementValid;
  const maxTenure = bothValid ? state.retirementAge! - state.age! : null;
  const retirementReached = maxTenure !== null && maxTenure <= 0;
  const nearRetirement = maxTenure !== null && maxTenure > 0 && maxTenure <= 5;

  const canContinue = Boolean(state.sector) && Boolean(state.occupationId) && ageValid && retirementValid && !retirementReached;

  useEffect(() => {
    setField('canGoNext', canContinue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canContinue]);

  return (
    <div className="fade-in space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-text-900">{t('step2Title')}</h1>
        <p className="mt-1 text-[14px] text-text-600">{t('step2Sub')}</p>
      </div>

      <section>
        <Label>Employment sector</Label>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {SECTORS.map((s) => (
            <ChoiceCard key={s} title={t(`sector.${s}`)} selected={state.sector === s} onClick={() => setField('sector', s)} />
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label>Occupation</Label>
          <Select
            value={state.occupationId ?? ''}
            onChange={(v) => setField('occupationId', v)}
            placeholder="Select occupation"
            options={occupations.map((o) => ({ value: o.id, label: o.label }))}
          />
          {state.occupationId === 'general' && (
            <div className="mt-2">
              <TextInput
                placeholder="Your job title (optional)"
                value={state.customOccupation}
                onChange={(e) => setField('customOccupation', e.target.value)}
              />
              <Hint>Used for lead quality only — does not affect your eligibility calculation.</Hint>
            </div>
          )}
        </div>
        <div />
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label>Applicant age</Label>
          <TextInput
            type="number"
            placeholder="e.g. 32"
            value={state.age ?? ''}
            onChange={(e) => setField('age', e.target.value === '' ? null : Number(e.target.value))}
            invalid={state.age !== null && !ageValid}
          />
          {state.age !== null && !ageValid && <Hint tone="danger">Age must be between 18 and 70.</Hint>}
        </div>
        <div>
          <Label>Expected retirement age</Label>
          <TextInput
            type="number"
            placeholder="Auto-filled from sector"
            value={state.retirementAge ?? ''}
            onChange={(e) => {
              setField('retirementAgeCustom', true);
              setField('retirementAge', e.target.value === '' ? null : Number(e.target.value));
            }}
          />
        </div>
      </section>

      <section className="rounded-xl border border-line bg-teal-50 p-4">
        {!bothValid && <p className="text-sm text-text-600">Enter your age and retirement age to see your maximum loan tenure.</p>}
        {bothValid && retirementReached && (
          <p className="text-sm font-semibold text-danger">
            Retirement age reached — standard tenure lending is not available for this profile.
          </p>
        )}
        {bothValid && !retirementReached && (
          <div>
            <p className="text-sm text-text-900">
              Maximum tenure: <span className="font-mono font-semibold">{maxTenure} years</span>
            </p>
            {nearRetirement && (
              <p className="mt-1 text-[13px] font-semibold text-amber-700">
                Retirement in {maxTenure} years — maximum tenure capped at {maxTenure} years.
              </p>
            )}
          </div>
        )}
      </section>

      <section className="flex items-start justify-between gap-4 rounded-xl border border-line p-4">
        <div>
          <p className="text-sm font-semibold text-text-900">Joint Applicant</p>
          <p className="mt-0.5 text-[13px] text-text-600">Add a co-applicant's income to boost your affordability.</p>
          {state.loanCategory === 'housing' && <Badge tone="teal" className="mt-2">Recommended for Housing Loans</Badge>}
        </div>
        <Switch checked={state.jointApplicant} onCheckedChange={(v) => setField('jointApplicant', v)} />
      </section>
      {state.jointApplicant && (
        <div>
          <Label>Co-applicant monthly gross income</Label>
          <MoneyInput value={state.coApplicantIncome} onChange={(v) => setField('coApplicantIncome', v)} />
        </div>
      )}

      <div className="flex justify-between pt-2">
        <Button variant="ghost" onClick={onBack}>
          {t('back')}
        </Button>
        <Button onClick={onContinue} disabled={!canContinue}>
          {t('continue')}
        </Button>
      </div>
    </div>
  );
}
