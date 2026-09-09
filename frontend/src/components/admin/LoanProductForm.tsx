'use client';

import { useState } from 'react';
import type { AdminLoanProduct } from '@/hooks/useAdminLoanProducts';
import { useAdminBanks } from '@/hooks/useAdminBanks';
import { Label, Hint, TextInput } from '@/components/ui/Field';
import { Switch } from '@/components/ui/Switch';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';

const CATEGORIES = [
  { value: 'personal', label: 'Personal' },
  { value: 'housing', label: 'Housing' },
  { value: 'vehicle_leasing', label: 'Vehicle Leasing' },
  { value: 'education', label: 'Education' },
  { value: 'business', label: 'Business' },
  { value: 'pensioner', label: 'Pensioner' },
];

const OTHER_INCOME_TYPES = ['Rental', 'Business', 'Foreign Remittance', 'Pension', 'Allowances'];

const SECTOR_OPTIONS = ['Government', 'Semi-Government', 'Private', 'Doctor', 'Nurse', 'Any Professional', 'Self-Employed'];

const DOC_CHARGE_BASIS = [
  { value: 'pct_of_loan', label: '% of loan' },
  { value: 'fixed_amount', label: 'Fixed amount' },
];

const GENDER_OPTIONS = [
  { value: 'any', label: 'Any' },
  { value: 'male_only', label: 'Male Only' },
  { value: 'female_only', label: 'Female Only' },
];

const INTEREST_RATE_TYPES = [
  { value: 'fixed', label: 'Fixed' },
  { value: 'variable', label: 'Variable' },
  { value: 'reducing_balance', label: 'Reducing Balance' },
  { value: 'flat', label: 'Flat' },
];

const COLLATERAL_TYPES = [
  { value: 'none', label: 'None' },
  { value: 'vehicle', label: 'Vehicle' },
  { value: 'property', label: 'Property' },
  { value: 'fixed_deposit', label: 'Fixed Deposit' },
];

const INSURANCE_TYPES = [
  { value: 'none', label: 'None' },
  { value: 'life', label: 'Life' },
  { value: 'asset', label: 'Asset' },
  { value: 'both', label: 'Both' },
];

const GUARANTOR_OPTIONS = [
  { value: '0', label: 'No' },
  { value: '1', label: '1 required' },
  { value: '2', label: '2 required' },
];

const DEFAULTS: Partial<AdminLoanProduct> = {
  bankId: '',
  name: '',
  category: 'personal',
  active: true,

  repaymentCapacityBasePct: 60,
  otIncomeIncluded: false,
  otAveragingPeriodMonths: null,
  otherIncomeConsidered: false,
  otherIncomeTypesAllowed: [],

  loanTenureMinMonths: 12,
  loanTenureMaxMonths: 60,
  loanAmountMin: 0,
  loanAmountMax: 0,
  repaymentPeriodMinMonths: 12,
  repaymentPeriodMaxMonths: 60,

  docChargeBasis: 'pct_of_loan',
  docChargeValue: 1,
  docChargeMin: 0,
  docChargeMax: 0,

  eligibleSectors: [],
  eligibleCompaniesListRequired: false,
  eligibleCompaniesReference: null,
  commonLoanOpenToAll: false,
  genderEligibility: 'any',
  ageMin: 21,
  ageMaxAtMaturity: 60,

  earlySettlementAllowed: true,
  earlySettlementChargePct: null,
  balloonPaymentAllowed: null,
  balloonPaymentPct: null,

  interestRateType: 'fixed',
  interestRatePct: 12,
  minEmploymentPeriodMonths: 6,
  minNetMonthlyIncome: 0,

  guarantorCount: 0,
  collateralType: 'none',
  insuranceType: 'none',

  latePaymentPenaltyPct: 2,
  gracePeriodDays: 0,
  processingTimeDays: 3,
  cribCheckRequired: true,
  salaryCreditedToBank: false,
  coApplicantAllowed: false,
  topUpLoanAllowedAfterMonths: null,
  currency: 'LKR',
};

function Section({ title, tone, children }: { title: string; tone: 'teal' | 'violet' | 'plain'; children: React.ReactNode }) {
  const cls =
    tone === 'teal'
      ? 'border-teal-100 bg-teal-50/40'
      : tone === 'violet'
        ? 'border-violet-100 bg-violet-100/20'
        : 'border-line';
  const titleCls = tone === 'teal' ? 'text-teal-800' : tone === 'violet' ? 'text-violet-700' : 'text-text-900';
  return (
    <section className={`space-y-4 rounded-2xl border p-4 ${cls}`}>
      <p className={`font-display text-sm font-bold ${titleCls}`}>{title}</p>
      {children}
    </section>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>;
}

export function LoanProductForm({
  initial,
  onSave,
  onCancel,
  saving,
}: {
  initial?: AdminLoanProduct;
  onSave: (data: Partial<AdminLoanProduct>) => void;
  onCancel: () => void;
  saving?: boolean;
}) {
  const { data: banks = [] } = useAdminBanks();
  const [form, setForm] = useState<Partial<AdminLoanProduct>>({ ...DEFAULTS, ...initial });
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof AdminLoanProduct>(key: K, value: AdminLoanProduct[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggleListValue(key: 'otherIncomeTypesAllowed' | 'eligibleSectors', value: string) {
    const current = form[key] ?? [];
    const next = current.includes(value) ? current.filter((x) => x !== value) : [...current, value];
    set(key, next);
  }

  function submit() {
    if (!form.bankId) {
      setError('Bank is required.');
      return;
    }
    if (!form.name) {
      setError('Loan product name is required.');
      return;
    }
    setError(null);
    const isLeasing = form.category === 'vehicle_leasing';
    onSave({
      ...form,
      repaymentCapacityBasePct: Number(form.repaymentCapacityBasePct),
      otAveragingPeriodMonths: form.otIncomeIncluded && form.otAveragingPeriodMonths ? Number(form.otAveragingPeriodMonths) : null,
      docChargeValue: Number(form.docChargeValue),
      earlySettlementChargePct:
        form.earlySettlementAllowed && form.earlySettlementChargePct != null && (form.earlySettlementChargePct as unknown) !== ''
          ? Number(form.earlySettlementChargePct)
          : null,
      balloonPaymentAllowed: isLeasing ? !!form.balloonPaymentAllowed : null,
      balloonPaymentPct: isLeasing && form.balloonPaymentAllowed && form.balloonPaymentPct != null && (form.balloonPaymentPct as unknown) !== '' ? Number(form.balloonPaymentPct) : null,
      interestRatePct: Number(form.interestRatePct),
      latePaymentPenaltyPct: Number(form.latePaymentPenaltyPct),
      topUpLoanAllowedAfterMonths:
        form.topUpLoanAllowedAfterMonths == null || (form.topUpLoanAllowedAfterMonths as unknown) === '' ? null : Number(form.topUpLoanAllowedAfterMonths),
      eligibleCompaniesReference: form.eligibleCompaniesListRequired ? form.eligibleCompaniesReference || null : null,
    });
  }

  const isLeasing = form.category === 'vehicle_leasing';

  return (
    <div className="space-y-6">
      {/* Identity & Category */}
      <Section title="Identity & Category" tone="teal">
        <Grid>
          <div>
            <Label>Bank</Label>
            <Select
              value={form.bankId ?? ''}
              onChange={(v) => set('bankId', v)}
              options={banks.map((b) => ({ value: b.id, label: b.name }))}
              placeholder="Select a bank"
            />
          </div>
          <div>
            <Label>Loan Product Name</Label>
            <TextInput value={form.name ?? ''} onChange={(e) => set('name', e.target.value)} />
          </div>
          <div>
            <Label>Loan Category</Label>
            <Select value={form.category ?? 'personal'} onChange={(v) => set('category', v as AdminLoanProduct['category'])} options={CATEGORIES} />
          </div>
          <div>
            <Label>Currency</Label>
            <TextInput value={form.currency ?? 'LKR'} onChange={(e) => set('currency', e.target.value)} />
          </div>
        </Grid>
        {error && <Hint tone="danger">{error}</Hint>}
        <Switch checked={!!form.active} onCheckedChange={(v) => set('active', v)} label="Active" />
      </Section>

      {/* Income & Repayment Capacity */}
      <Section title="Income & Repayment Capacity" tone="plain">
        <Grid>
          <div>
            <Label>Repayment Capacity Base (% of Gross Salary)</Label>
            <TextInput type="number" step="0.01" value={form.repaymentCapacityBasePct ?? ''} onChange={(e) => set('repaymentCapacityBasePct', e.target.value as never)} />
          </div>
          <div className="flex items-center gap-6 pt-6">
            <Switch checked={!!form.otIncomeIncluded} onCheckedChange={(v) => set('otIncomeIncluded', v)} label="OT Income Included" />
          </div>
          {form.otIncomeIncluded && (
            <div>
              <Label>OT Averaging Period (months)</Label>
              <TextInput type="number" value={form.otAveragingPeriodMonths ?? ''} onChange={(e) => set('otAveragingPeriodMonths', (e.target.value === '' ? null : Number(e.target.value)) as never)} />
            </div>
          )}
          <div className="flex items-center gap-6 pt-6">
            <Switch checked={!!form.otherIncomeConsidered} onCheckedChange={(v) => set('otherIncomeConsidered', v)} label="Other Income Considered" />
          </div>
        </Grid>
        {form.otherIncomeConsidered && (
          <div>
            <Label>Other Income Types Allowed</Label>
            <div className="flex flex-wrap gap-3">
              {OTHER_INCOME_TYPES.map((t) => (
                <label key={t} className="flex items-center gap-1.5 text-sm">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-teal-700"
                    checked={(form.otherIncomeTypesAllowed ?? []).includes(t)}
                    onChange={() => toggleListValue('otherIncomeTypesAllowed', t)}
                  />
                  {t}
                </label>
              ))}
            </div>
          </div>
        )}
      </Section>

      {/* Tenure, Loan Amount & Doc Charges */}
      <Section title="Tenure, Loan Amount & Documentation Charges" tone="plain">
        <Grid>
          <div>
            <Label>Loan Tenure Min (months)</Label>
            <TextInput type="number" value={form.loanTenureMinMonths ?? ''} onChange={(e) => set('loanTenureMinMonths', Number(e.target.value))} />
          </div>
          <div>
            <Label>Loan Tenure Max (months)</Label>
            <TextInput type="number" value={form.loanTenureMaxMonths ?? ''} onChange={(e) => set('loanTenureMaxMonths', Number(e.target.value))} />
          </div>
          <div>
            <Label>Loan Amount Min (LKR)</Label>
            <TextInput type="number" value={form.loanAmountMin ?? ''} onChange={(e) => set('loanAmountMin', Number(e.target.value))} />
          </div>
          <div>
            <Label>Loan Amount Max (LKR)</Label>
            <TextInput type="number" value={form.loanAmountMax ?? ''} onChange={(e) => set('loanAmountMax', Number(e.target.value))} />
          </div>
          <div>
            <Label>Repayment Period Min (months)</Label>
            <TextInput type="number" value={form.repaymentPeriodMinMonths ?? ''} onChange={(e) => set('repaymentPeriodMinMonths', Number(e.target.value))} />
          </div>
          <div>
            <Label>Repayment Period Max (months)</Label>
            <TextInput type="number" value={form.repaymentPeriodMaxMonths ?? ''} onChange={(e) => set('repaymentPeriodMaxMonths', Number(e.target.value))} />
          </div>
          <div>
            <Label>Documentation Charge Basis</Label>
            <Select value={form.docChargeBasis ?? 'pct_of_loan'} onChange={(v) => set('docChargeBasis', v as AdminLoanProduct['docChargeBasis'])} options={DOC_CHARGE_BASIS} />
          </div>
          <div>
            <Label>Documentation Charge Value {form.docChargeBasis === 'fixed_amount' ? '(LKR)' : '(%)'}</Label>
            <TextInput type="number" step="0.01" value={form.docChargeValue ?? ''} onChange={(e) => set('docChargeValue', e.target.value as never)} />
          </div>
          <div>
            <Label>Documentation Charge Min (LKR)</Label>
            <TextInput type="number" value={form.docChargeMin ?? ''} onChange={(e) => set('docChargeMin', Number(e.target.value))} />
          </div>
          <div>
            <Label>Documentation Charge Max (LKR)</Label>
            <TextInput type="number" value={form.docChargeMax ?? ''} onChange={(e) => set('docChargeMax', Number(e.target.value))} />
          </div>
        </Grid>
      </Section>

      {/* Eligibility */}
      <Section title="Eligibility" tone="plain">
        <div>
          <Label>Eligible Profession / Sector</Label>
          <div className="flex flex-wrap gap-3">
            {SECTOR_OPTIONS.map((s) => (
              <label key={s} className="flex items-center gap-1.5 text-sm">
                <input type="checkbox" className="h-4 w-4 accent-teal-700" checked={(form.eligibleSectors ?? []).includes(s)} onChange={() => toggleListValue('eligibleSectors', s)} />
                {s}
              </label>
            ))}
          </div>
        </div>
        <Grid>
          <div className="flex items-center gap-6 pt-2">
            <Switch checked={!!form.commonLoanOpenToAll} onCheckedChange={(v) => set('commonLoanOpenToAll', v)} label="Common Loan (Open to All)" />
          </div>
          <div>
            <Label>Gender Eligibility</Label>
            <Select value={form.genderEligibility ?? 'any'} onChange={(v) => set('genderEligibility', v as AdminLoanProduct['genderEligibility'])} options={GENDER_OPTIONS} />
          </div>
          <div>
            <Label>Age Min (years)</Label>
            <TextInput type="number" value={form.ageMin ?? ''} onChange={(e) => set('ageMin', Number(e.target.value))} />
          </div>
          <div>
            <Label>Age Max at Maturity (years)</Label>
            <TextInput type="number" value={form.ageMaxAtMaturity ?? ''} onChange={(e) => set('ageMaxAtMaturity', Number(e.target.value))} />
          </div>
        </Grid>
        <div className="flex items-center gap-6 pt-2">
          <Switch checked={!!form.eligibleCompaniesListRequired} onCheckedChange={(v) => set('eligibleCompaniesListRequired', v)} label="Eligible Companies List Required" />
        </div>
        {form.eligibleCompaniesListRequired && (
          <div>
            <Label>Eligible Companies Reference (list name)</Label>
            <TextInput value={form.eligibleCompaniesReference ?? ''} onChange={(e) => set('eligibleCompaniesReference', e.target.value)} placeholder="e.g. Approved Employer List – Tier A/B" />
          </div>
        )}
      </Section>

      {/* Rates, Early Settlement & Leasing */}
      <Section title="Rates, Early Settlement & Leasing" tone="violet">
        <Grid>
          <div>
            <Label>Interest Rate Type</Label>
            <Select value={form.interestRateType ?? 'fixed'} onChange={(v) => set('interestRateType', v as AdminLoanProduct['interestRateType'])} options={INTEREST_RATE_TYPES} />
          </div>
          <div>
            <Label>Interest Rate (% p.a.)</Label>
            <TextInput type="number" step="0.01" value={form.interestRatePct ?? ''} onChange={(e) => set('interestRatePct', e.target.value as never)} />
          </div>
          <div className="flex items-center gap-6 pt-6">
            <Switch checked={!!form.earlySettlementAllowed} onCheckedChange={(v) => set('earlySettlementAllowed', v)} label="Early Settlement Allowed" />
          </div>
          {form.earlySettlementAllowed && (
            <div>
              <Label>Early Settlement Charge (%)</Label>
              <TextInput type="number" step="0.01" value={form.earlySettlementChargePct ?? ''} onChange={(e) => set('earlySettlementChargePct', (e.target.value === '' ? null : e.target.value) as never)} />
            </div>
          )}
        </Grid>
        {isLeasing && (
          <Grid>
            <div className="flex items-center gap-6 pt-2">
              <Switch checked={!!form.balloonPaymentAllowed} onCheckedChange={(v) => set('balloonPaymentAllowed', v)} label="Balloon Payment Allowed" />
            </div>
            {form.balloonPaymentAllowed && (
              <div>
                <Label>Balloon Payment (% of Asset Value)</Label>
                <TextInput type="number" step="0.01" value={form.balloonPaymentPct ?? ''} onChange={(e) => set('balloonPaymentPct', (e.target.value === '' ? null : e.target.value) as never)} />
              </div>
            )}
          </Grid>
        )}
        {!isLeasing && <Hint>Balloon payment fields only apply when Loan Category = Vehicle Leasing.</Hint>}
      </Section>

      {/* Employment, Guarantor, Collateral & Insurance */}
      <Section title="Employment, Guarantor, Collateral & Insurance" tone="plain">
        <Grid>
          <div>
            <Label>Min. Employment / Confirmation Period (months)</Label>
            <TextInput type="number" value={form.minEmploymentPeriodMonths ?? ''} onChange={(e) => set('minEmploymentPeriodMonths', Number(e.target.value))} />
          </div>
          <div>
            <Label>Min. Net Monthly Income (LKR)</Label>
            <TextInput type="number" value={form.minNetMonthlyIncome ?? ''} onChange={(e) => set('minNetMonthlyIncome', Number(e.target.value))} />
          </div>
          <div>
            <Label>Guarantor Required</Label>
            <Select value={String(form.guarantorCount ?? 0)} onChange={(v) => set('guarantorCount', Number(v) as never)} options={GUARANTOR_OPTIONS} />
          </div>
          <div>
            <Label>Collateral / Security Required</Label>
            <Select value={form.collateralType ?? 'none'} onChange={(v) => set('collateralType', v as AdminLoanProduct['collateralType'])} options={COLLATERAL_TYPES} />
          </div>
          <div>
            <Label>Insurance Required</Label>
            <Select value={form.insuranceType ?? 'none'} onChange={(v) => set('insuranceType', v as AdminLoanProduct['insuranceType'])} options={INSURANCE_TYPES} />
          </div>
        </Grid>
      </Section>

      {/* Penalties, SLA & Bank Conditions */}
      <Section title="Penalties, SLA & Bank Conditions" tone="plain">
        <Grid>
          <div>
            <Label>Late Payment Penalty (%)</Label>
            <TextInput type="number" step="0.01" value={form.latePaymentPenaltyPct ?? ''} onChange={(e) => set('latePaymentPenaltyPct', e.target.value as never)} />
          </div>
          <div>
            <Label>Grace Period (days)</Label>
            <TextInput type="number" value={form.gracePeriodDays ?? ''} onChange={(e) => set('gracePeriodDays', Number(e.target.value))} />
          </div>
          <div>
            <Label>Processing / Approval Time (business days)</Label>
            <TextInput type="number" value={form.processingTimeDays ?? ''} onChange={(e) => set('processingTimeDays', Number(e.target.value))} />
          </div>
          <div>
            <Label>Top-Up Loan Allowed After (months)</Label>
            <TextInput type="number" placeholder="blank = N/A" value={form.topUpLoanAllowedAfterMonths ?? ''} onChange={(e) => set('topUpLoanAllowedAfterMonths', (e.target.value === '' ? null : Number(e.target.value)) as never)} />
          </div>
        </Grid>
        <div className="flex flex-wrap gap-6 pt-2">
          <Switch checked={!!form.cribCheckRequired} onCheckedChange={(v) => set('cribCheckRequired', v)} label="CRIB / Credit Bureau Check Required" />
          <Switch checked={!!form.salaryCreditedToBank} onCheckedChange={(v) => set('salaryCreditedToBank', v)} label="Salary Must Be Credited to This Bank" />
          <Switch checked={!!form.coApplicantAllowed} onCheckedChange={(v) => set('coApplicantAllowed', v)} label="Co-Applicant Allowed" />
        </div>
      </Section>

      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={submit} disabled={saving}>
          Save
        </Button>
      </div>
    </div>
  );
}
