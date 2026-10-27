import { useState } from 'react';
import Drawer from './components/Drawer.jsx';
import RemarksEditor from './components/RemarksEditor.jsx';
import { TextField, SelectField, CheckboxField } from './components/Field.jsx';
import { useLookups, toOptions } from './useLookups.js';
import { api, apiErrorMessage } from '../api/client.js';

function emptyProduct() {
  return {
    name: '', category: 'personal', status: 'active', isActive: true, interestRateType: 'fixed', benchmarkCode: null,
    interestRateTiers: [{ rateTypeCode: 'fixed', minTermYears: 1, maxTermYears: 5, fixedRateValue: null, marginOverAwplr: null, floorRate: null }],
    docChargeBasis: 'percent', docChargeValue: 0, docChargeMin: null, docChargeMax: null,
    maxTermYears: 5, dtiOverride: null, otIncluded: true, otPct: 100, otherIncomeIncluded: false, otherIncomePct: 0,
    loanAmountMin: 0, loanAmountMax: null, minNetMonthlyIncome: 0, eligibleSector: null,
    targetOccupation: 'all', targetGender: 'all', commonLoan: false,
    companiesListRequired: false, companiesListId: null,
    ageMin: 18, ageMaxAtMaturity: 65, minEmploymentMonths: 0,
    guarantorRequired: 'no', collateralRequired: 'none', insuranceRequired: 'none',
    balloonAllowed: 'na', balloonPct: 0, earlySettlementAllowed: true, earlySettlementChargePct: 0,
    latePaymentPenaltyPct: 0, gracePeriodDays: 0, processingDays: 3,
    cribCheckRequired: true, salaryCreditRequired: false, coApplicantAllowed: true,
    topUpAfterMonths: null, currency: 'LKR', ratesEffectiveDate: null, remarks: [],
  };
}

// "F 12.50–14.00% · V AWPLR+2.50%" — compact pricing line for product lists.
export function rateSummary(p) {
  const tiers = p.interestRateTiers || [];
  const parts = [];
  const fixed = tiers.filter((t) => t.rateTypeCode === 'fixed' && t.fixedRateValue != null).map((t) => t.fixedRateValue);
  if (fixed.length) {
    const lo = Math.min(...fixed).toFixed(2);
    const hi = Math.max(...fixed).toFixed(2);
    parts.push(`F ${lo === hi ? lo : `${lo}–${hi}`}%`);
  }
  const margins = tiers.filter((t) => t.rateTypeCode === 'variable' && t.marginOverAwplr != null).map((t) => t.marginOverAwplr);
  if (margins.length) parts.push(`V AWPLR+${Math.min(...margins).toFixed(2)}%`);
  const flatVariable = tiers.filter((t) => t.rateTypeCode === 'variable' && t.fixedRateValue != null).map((t) => t.fixedRateValue);
  if (flatVariable.length) parts.push(`V ${Math.min(...flatVariable).toFixed(2)}%`);
  return parts.join(' · ') || 'no rate tiers';
}

const numOrNull = (v) => (v === '' || v == null ? null : Number(v));

function TierTable({ tiers, onChange }) {
  const update = (idx, patch) => onChange(tiers.map((t, i) => (i === idx ? { ...t, ...patch } : t)));
  return (
    <div className="overflow-x-auto">
      <table className="tier-table w-full">
        <thead>
          <tr><th className="text-left px-2 py-2">Type</th><th className="px-2">From (yrs)</th><th className="px-2">To (yrs)</th><th className="px-2">Fixed rate %</th><th className="px-2">Margin over AWPLR %</th><th className="px-2">Floor %</th><th /></tr>
        </thead>
        <tbody>
          {tiers.map((t, idx) => (
            <tr key={idx}>
              <td>
                <select value={t.rateTypeCode} onChange={(e) => update(idx, { rateTypeCode: e.target.value, ...(e.target.value === 'fixed' ? { marginOverAwplr: null, floorRate: null } : {}) })}>
                  <option value="fixed">Fixed</option>
                  <option value="variable">Variable</option>
                </select>
              </td>
              <td><input type="number" className="tier-yrs" value={t.minTermYears ?? ''} onChange={(e) => update(idx, { minTermYears: numOrNull(e.target.value) })} /></td>
              <td><input type="number" className="tier-yrs" value={t.maxTermYears ?? ''} onChange={(e) => update(idx, { maxTermYears: numOrNull(e.target.value) })} /></td>
              <td><input type="number" step="0.05" className="tier-rate" value={t.fixedRateValue ?? ''} onChange={(e) => update(idx, { fixedRateValue: numOrNull(e.target.value) })} /></td>
              <td>
                {t.rateTypeCode === 'variable'
                  ? <input type="number" step="0.05" className="tier-rate" value={t.marginOverAwplr ?? ''} onChange={(e) => update(idx, { marginOverAwplr: numOrNull(e.target.value) })} />
                  : <span>—</span>}
              </td>
              <td>
                {t.rateTypeCode === 'variable'
                  ? <input type="number" step="0.05" className="tier-rate" value={t.floorRate ?? ''} onChange={(e) => update(idx, { floorRate: numOrNull(e.target.value) })} />
                  : <span>—</span>}
              </td>
              <td><button type="button" onClick={() => onChange(tiers.filter((_, i) => i !== idx))} className="text-xs" style={{ color: 'var(--color-adm-danger)' }}>Remove</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      <button
        type="button" className="admin-btn-ghost px-3 py-1.5 text-xs mt-2"
        onClick={() => onChange([...tiers, { rateTypeCode: 'fixed', minTermYears: 1, maxTermYears: 5, fixedRateValue: null, marginOverAwplr: null, floorRate: null }])}
      >
        + Add tier
      </button>
      <p className="hint">A variable tier uses either a flat rate, or AWPLR + margin (never below the floor). A term with no tier isn't offered.</p>
    </div>
  );
}

export default function ProductDrawer({ bankId, product, companyLists, onClose, onSaved }) {
  const lookups = useLookups();
  const [form, setForm] = useState(() => (product ? { ...emptyProduct(), ...product } : emptyProduct()));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const occupations = lookups?.occupations || [];
  const targetOccList = Array.isArray(form.targetOccupation) ? form.targetOccupation : [];
  const isAllOccupations = !targetOccList.length;
  const hasVariableTier = form.interestRateTiers.some((t) => t.rateTypeCode === 'variable' && t.marginOverAwplr != null);

  const toggleOccupation = (id) => {
    const next = targetOccList.includes(id) ? targetOccList.filter((o) => o !== id) : [...targetOccList, id];
    set({ targetOccupation: next.length ? next : 'all' });
  };

  const relevantLists = companyLists.filter((l) => l.bankId === bankId);

  const save = async () => {
    setSaving(true);
    setError('');
    // dbId/id/bankId/etc. are identity, not editable columns.
    const { dbId, id, bankId: _b, code, ...body } = form;
    try {
      if (product?.dbId) await api.put(`/admin/banks/${bankId}/products/${product.dbId}`, body);
      else await api.post(`/admin/banks/${bankId}/products`, body);
      onSaved();
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not save the product.'));
    } finally {
      setSaving(false);
    }
  };

  const section = { borderColor: 'var(--color-adm-border)' };

  return (
    <Drawer title={product ? `Edit: ${product.name}` : 'Add Product'} onClose={onClose} onSave={save} saving={saving} error={error} wide>
      <div className="grid sm:grid-cols-2 gap-4">
        <TextField label="Product name" value={form.name} onChange={(v) => set({ name: v })} />
        <SelectField label="Category" value={form.category} onChange={(v) => set({ category: v })} options={toOptions(lookups?.loanCategories)} />
        <SelectField label="Status" value={form.status} onChange={(v) => set({ status: v })} options={toOptions(lookups?.productStatuses)} />
        <SelectField label="Headline rate type" value={form.interestRateType} onChange={(v) => set({ interestRateType: v })} options={toOptions(lookups?.interestRateTypes)} />
        <SelectField label="Currency" value={form.currency} onChange={(v) => set({ currency: v })} options={toOptions(lookups?.currencies)} />
        <TextField label="Rates effective date" type="date" value={form.ratesEffectiveDate?.slice(0, 10)} onChange={(v) => set({ ratesEffectiveDate: v || null })} />
      </div>

      <div className="border-t pt-4" style={section}>
        <h3 className="font-semibold text-sm mb-3">Interest-rate tiers</h3>
        <TierTable tiers={form.interestRateTiers} onChange={(interestRateTiers) => set({ interestRateTiers })} />
        {hasVariableTier && (
          <div className="mt-3 max-w-sm">
            <SelectField
              label="Benchmark the variable tiers float on" value={form.benchmarkCode || ''}
              onChange={(v) => set({ benchmarkCode: v || null })}
              options={[{ value: '', label: 'System default' }, ...(lookups?.benchmarks || []).map((b) => ({ value: b.code, label: `${b.label}${b.rate != null ? ` (${b.rate.toFixed(2)}%)` : ''}` }))]}
            />
          </div>
        )}
      </div>

      <div className="border-t pt-4" style={section}>
        <h3 className="font-semibold text-sm mb-3">Doc charge</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <SelectField label="Basis" value={form.docChargeBasis} onChange={(v) => set({ docChargeBasis: v })} options={toOptions(lookups?.docChargeBasis)} />
          <TextField label={form.docChargeBasis === 'fixed' ? 'Amount (LKR)' : 'Value (%)'} type="number" value={form.docChargeValue} onChange={(v) => set({ docChargeValue: v })} />
          <TextField label="Min (LKR)" type="number" value={form.docChargeMin} onChange={(v) => set({ docChargeMin: v })} />
          <TextField label="Max (LKR)" type="number" value={form.docChargeMax} onChange={(v) => set({ docChargeMax: v })} />
        </div>
      </div>

      <div className="border-t pt-4" style={section}>
        <h3 className="font-semibold text-sm mb-3">Affordability</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <TextField label="Max term (years)" type="number" value={form.maxTermYears} onChange={(v) => set({ maxTermYears: v })} />
          <TextField label="DTI override (%, optional)" type="number" value={form.dtiOverride} onChange={(v) => set({ dtiOverride: v })} />
          <TextField label="Min net monthly income" type="number" value={form.minNetMonthlyIncome} onChange={(v) => set({ minNetMonthlyIncome: v })} />
          <TextField label="Loan amount min" type="number" value={form.loanAmountMin} onChange={(v) => set({ loanAmountMin: v })} />
          <TextField label="Loan amount max" type="number" value={form.loanAmountMax} onChange={(v) => set({ loanAmountMax: v })} />
        </div>
        <div className="grid sm:grid-cols-2 gap-4 mt-3">
          <div className="flex items-end gap-3">
            <CheckboxField label="OT income included" checked={form.otIncluded} onChange={(v) => set({ otIncluded: v })} />
          </div>
          <div className="flex items-end gap-3">
            <CheckboxField label="Other income included" checked={form.otherIncomeIncluded} onChange={(v) => set({ otherIncomeIncluded: v })} />
          </div>
          {form.otIncluded && <TextField label="OT % counted" type="number" value={form.otPct} onChange={(v) => set({ otPct: v })} />}
          {form.otherIncomeIncluded && <TextField label="Other income % counted" type="number" value={form.otherIncomePct} onChange={(v) => set({ otherIncomePct: v })} />}
        </div>
      </div>

      <div className="border-t pt-4" style={section}>
        <h3 className="font-semibold text-sm mb-3">Eligibility targeting</h3>
        <div className="flex gap-4 mb-3">
          <CheckboxField label="Common loan (open to all — skips occupation/sector/gender targeting)" checked={form.commonLoan} onChange={(v) => set({ commonLoan: v })} />
        </div>
        {!form.commonLoan && (
          <>
            <label className="field-label">Target occupations</label>
            <div className="flex flex-wrap gap-2 mb-3">
              <button type="button" onClick={() => set({ targetOccupation: 'all' })} className={`admin-badge ${isAllOccupations ? 'admin-badge-active' : 'admin-badge-inactive'}`}>All</button>
              {occupations.map((o) => (
                <button
                  key={o.id} type="button" onClick={() => toggleOccupation(o.id)}
                  className={`admin-badge ${targetOccList.includes(o.id) ? 'admin-badge-active' : 'admin-badge-inactive'}`}
                >
                  {o.label}
                </button>
              ))}
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <SelectField label="Target gender" value={form.targetGender} onChange={(v) => set({ targetGender: v })} options={toOptions(lookups?.genders)} />
              <SelectField
                label="Eligible sector" value={form.eligibleSector || ''} onChange={(v) => set({ eligibleSector: v || null })}
                options={[{ value: '', label: 'All sectors' }, ...toOptions(lookups?.sectors)]}
              />
            </div>
          </>
        )}

        <div className="grid sm:grid-cols-3 gap-4 mt-3">
          <TextField label="Age min" type="number" value={form.ageMin} onChange={(v) => set({ ageMin: v })} />
          <TextField label="Age max at maturity" type="number" value={form.ageMaxAtMaturity} onChange={(v) => set({ ageMaxAtMaturity: v })} />
          <TextField label="Min employment (months)" type="number" value={form.minEmploymentMonths} onChange={(v) => set({ minEmploymentMonths: v })} />
        </div>

        <div className="mt-3">
          <CheckboxField label="Requires approved employer/company list" checked={form.companiesListRequired} onChange={(v) => set({ companiesListRequired: v })} />
          {form.companiesListRequired && (
            <div className="mt-2 max-w-sm">
              <SelectField
                label="Which list" value={form.companiesListId ?? ''} onChange={(v) => set({ companiesListId: v ? Number(v) : null })}
                options={[{ value: '', label: 'Select a list' }, ...relevantLists.map((l) => ({ value: l.id, label: l.name }))]}
              />
            </div>
          )}
        </div>
      </div>

      <div className="border-t pt-4" style={section}>
        <h3 className="font-semibold text-sm mb-3">Terms &amp; conditions</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <SelectField label="Guarantor" value={form.guarantorRequired} onChange={(v) => set({ guarantorRequired: v })} options={toOptions(lookups?.guarantorTerms)} />
          <SelectField label="Collateral" value={form.collateralRequired} onChange={(v) => set({ collateralRequired: v })} options={toOptions(lookups?.collateralTypes)} />
          <SelectField label="Insurance" value={form.insuranceRequired} onChange={(v) => set({ insuranceRequired: v })} options={toOptions(lookups?.insuranceTypes)} />
          <SelectField label="Balloon payment" value={form.balloonAllowed} onChange={(v) => set({ balloonAllowed: v })} options={[{ value: 'na', label: 'N/A' }, { value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }]} />
          {form.balloonAllowed === 'yes' && <TextField label="Balloon %" type="number" value={form.balloonPct} onChange={(v) => set({ balloonPct: v })} />}
          <TextField label="Early settlement charge %" type="number" value={form.earlySettlementChargePct} onChange={(v) => set({ earlySettlementChargePct: v })} />
          <TextField label="Late payment penalty %" type="number" value={form.latePaymentPenaltyPct} onChange={(v) => set({ latePaymentPenaltyPct: v })} />
          <TextField label="Grace period (days)" type="number" value={form.gracePeriodDays} onChange={(v) => set({ gracePeriodDays: v })} />
          <TextField label="Processing days" type="number" value={form.processingDays} onChange={(v) => set({ processingDays: v })} />
          <TextField label="Top-up allowed after (months)" type="number" value={form.topUpAfterMonths} onChange={(v) => set({ topUpAfterMonths: v })} />
        </div>
        <div className="flex flex-wrap gap-4 mt-3">
          <CheckboxField label="Early settlement allowed" checked={form.earlySettlementAllowed} onChange={(v) => set({ earlySettlementAllowed: v })} />
          <CheckboxField label="CRIB check required" checked={form.cribCheckRequired} onChange={(v) => set({ cribCheckRequired: v })} />
          <CheckboxField label="Salary credit required" checked={form.salaryCreditRequired} onChange={(v) => set({ salaryCreditRequired: v })} />
          <CheckboxField label="Co-applicant allowed" checked={form.coApplicantAllowed} onChange={(v) => set({ coApplicantAllowed: v })} />
        </div>
      </div>

      <div className="border-t pt-4" style={section}>
        <h3 className="font-semibold text-sm mb-3">Remarks</h3>
        <RemarksEditor remarks={form.remarks} onChange={(remarks) => set({ remarks })} />
      </div>
    </Drawer>
  );
}
