'use client';

import { useTranslation } from 'react-i18next';
import { useWizardStore } from '@/store/wizardStore';
import { Label, Hint, MoneyInput, TextInput } from '@/components/ui/Field';
import { Slider } from '@/components/ui/Slider';
import { Switch } from '@/components/ui/Switch';
import { Button } from '@/components/ui/Button';

export function Step4Details({ onContinue, onBack }: { onContinue: () => void; onBack: () => void }) {
  const { t } = useTranslation();
  const state = useWizardStore();
  const setField = useWizardStore((s) => s.setField);

  const vehicleTooOld = state.loanCategory === 'vehicle' && new Date().getFullYear() - state.vehicleYear > 15;
  const legalFee = state.loanCategory === 'housing' ? Math.min(state.housingPropertyValue * 0.003, 100000) : 0;

  return (
    <div className="fade-in space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-text-900">{t('step4Title')}</h1>
        <p className="mt-1 text-[14px] text-text-600">{t('step4Sub')}</p>
      </div>

      {state.loanCategory === 'vehicle' && (
        <section className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>Vehicle Valuation</Label>
              <MoneyInput value={state.vehicleValuation} onChange={(v) => setField('vehicleValuation', v)} />
            </div>
            <div>
              <Label>Manufacturing Year</Label>
              <TextInput type="number" value={state.vehicleYear} onChange={(e) => setField('vehicleYear', Number(e.target.value))} />
              {vehicleTooOld && <Hint tone="danger">Vehicles over 15 years old are not eligible for leasing with any bank.</Hint>}
            </div>
          </div>
          <div>
            <Label>Down Payment: {state.vehicleDownPaymentPct}%</Label>
            <Slider value={state.vehicleDownPaymentPct} min={10} max={50} onValueChange={(v) => setField('vehicleDownPaymentPct', v)} />
          </div>
          <Switch checked={state.vehicleBalloon} onCheckedChange={(v) => setField('vehicleBalloon', v)} label="Balloon Payment" />
          <div>
            <Label>Target Loan Term Preference: {state.requestedTermYears} years</Label>
            <Slider value={state.requestedTermYears} min={1} max={7} onValueChange={(v) => setField('requestedTermYears', v)} />
            <Hint>Each bank applies its own maximum tenure on top of this preference.</Hint>
          </div>
        </section>
      )}

      {state.loanCategory === 'housing' && (
        <section className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>Property Value</Label>
              <MoneyInput value={state.housingPropertyValue} onChange={(v) => setField('housingPropertyValue', v)} />
            </div>
            <div>
              <Label>Repayment Duration: {state.housingTerm} years</Label>
              <Slider value={state.housingTerm} min={5} max={30} onValueChange={(v) => setField('housingTerm', v)} />
              <Hint>Each bank applies its own maximum tenure on top of this preference.</Hint>
            </div>
          </div>
          <div>
            <Label>Down Payment: {state.housingDownPaymentPct}%</Label>
            <Slider value={state.housingDownPaymentPct} min={10} max={50} onValueChange={(v) => setField('housingDownPaymentPct', v)} />
          </div>
          <Hint>Estimated Legal &amp; Valuation Fee: LKR {legalFee.toLocaleString('en-LK')} (0.3% of property value, capped at LKR 100,000)</Hint>
        </section>
      )}

      {state.loanCategory === 'business' && (
        <section>
          <Label>Target Loan Term Preference: {state.businessTermYears} years</Label>
          <Slider value={state.businessTermYears} min={1} max={7} onValueChange={(v) => setField('businessTermYears', v)} />
          <Hint>Each bank applies its own maximum tenure on top of this preference.</Hint>
        </section>
      )}

      {(state.loanCategory === 'personal' || state.loanCategory === 'professional') && (
        <section>
          <Label>Target Loan Term Preference: {state.requestedTermYears} years</Label>
          <Slider value={state.requestedTermYears} min={1} max={8} onValueChange={(v) => setField('requestedTermYears', v)} />
          <Hint>Each bank applies its own maximum tenure on top of this preference.</Hint>
        </section>
      )}

      <section className="space-y-3 rounded-xl2 border border-line p-4">
        <div>
          <Label>Monthly Existing Loan &amp; Credit Card Commitments (LKR)</Label>
          <MoneyInput
            value={state.existingObligations}
            onChange={(v) => {
              setField('existingObligations', v);
              if (v <= 0) {
                setField('settleWithNewLoan', false);
                setField('outstandingBalanceToSettle', 0);
              }
            }}
          />
        </div>
        {state.existingObligations > 0 && (
          <>
            <Switch
              checked={state.settleWithNewLoan}
              onCheckedChange={(v) => setField('settleWithNewLoan', v)}
              label="I plan to fully settle these existing loans using this new facility"
            />
            {state.settleWithNewLoan && (
              <div>
                <Label>Outstanding balance to settle (LKR)</Label>
                <MoneyInput value={state.outstandingBalanceToSettle} onChange={(v) => setField('outstandingBalanceToSettle', v)} />
              </div>
            )}
          </>
        )}
      </section>

      <div className="flex justify-between pt-2">
        <Button variant="ghost" onClick={onBack}>
          {t('back')}
        </Button>
        <Button onClick={onContinue} disabled={vehicleTooOld}>
          {t('seeEligibleBanks')}
        </Button>
      </div>
    </div>
  );
}
