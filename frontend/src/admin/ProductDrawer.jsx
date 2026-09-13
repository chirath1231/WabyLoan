import { useEffect, useState } from 'react';
import Drawer from './components/Drawer.jsx';
import { TextField, SelectField, CheckboxField } from './components/Field.jsx';
import { api } from '../api/client.js';

const CATEGORIES = ['personal', 'professional', 'housing', 'vehicle', 'business', 'pension'];
const STATUSES = ['active', 'suspended', 'promotional'];

function emptyProduct() {
  return {
    name: '', category: 'personal', status: 'active', rate: 0, interestRateType: 'variable',
    docChargeBasis: 'percent', docChargeValue: 0, docChargeMin: 0, docChargeMax: 0,
    maxTermYears: 5, dtiOverride: null, otIncluded: false, otherIncomePct: 0,
    loanAmountMin: 0, loanAmountMax: 0, minNetMonthlyIncome: 0,
    targetOccupation: 'all', targetGender: 'all', commonLoan: false,
    companiesListRequired: false, companiesListId: null,
    ageMin: 18, ageMaxAtMaturity: 65, minEmploymentMonths: 0,
    guarantorRequired: 'no', collateralRequired: 'none', insuranceRequired: 'none',
    balloonAllowed: 'na', balloonPct: 0, earlySettlementAllowed: true, earlySettlementChargePct: 0,
    latePaymentPenaltyPct: 0, gracePeriodDays: 0, processingDays: 0,
    cribCheckRequired: true, salaryCreditRequired: false, coApplicantAllowed: false,
    topUpAfterMonths: null, currency: 'LKR', remarks: [],
  };
}

export default function ProductDrawer({ bankId, product, companyLists, onClose, onSaved }) {
  const [form, setForm] = useState(() => (product ? { ...emptyProduct(), ...product } : emptyProduct()));
  const [occupations, setOccupations] = useState([]);
  const [saving, setSaving] = useState(false);
  const [remarkDraft, setRemarkDraft] = useState('');

  useEffect(() => {
    api.get('/occupations').then(({ data }) => setOccupations(data.occupations));
  }, []);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const targetOccList = Array.isArray(form.targetOccupation) ? form.targetOccupation : [];
  const isAllOccupations = form.targetOccupation === 'all';

  const toggleOccupation = (id) => {
    if (isAllOccupations) return set({ targetOccupation: [id] });
    const next = targetOccList.includes(id) ? targetOccList.filter((o) => o !== id) : [...targetOccList, id];
    set({ targetOccupation: next.length ? next : 'all' });
  };

  const addRemark = () => {
    if (!remarkDraft.trim()) return;
    set({ remarks: [...(form.remarks || []), remarkDraft.trim()] });
    setRemarkDraft('');
  };
  const removeRemark = (i) => set({ remarks: form.remarks.filter((_, idx) => idx !== i) });

  const relevantLists = companyLists.filter((l) => l.bankId === bankId);

  const save = async () => {
    setSaving(true);
    try {
      if (product?.dbId) {
        await api.put(`/admin/banks/${bankId}/products/${product.dbId}`, form);
      } else {
        await api.post(`/admin/banks/${bankId}/products`, form);
      }
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer title={product ? `Edit: ${product.name}` : 'Add Product'} onClose={onClose} onSave={save} saving={saving} wide>
      <div className="grid sm:grid-cols-2 gap-4">
        <TextField label="Product name" value={form.name} onChange={(v) => set({ name: v })} />
        <SelectField label="Category" value={form.category} onChange={(v) => set({ category: v })} options={CATEGORIES.map((c) => ({ value: c, label: c }))} />
        <SelectField label="Status" value={form.status} onChange={(v) => set({ status: v })} options={STATUSES.map((s) => ({ value: s, label: s }))} />
        <TextField label="Rate (%)" type="number" value={form.rate} onChange={(v) => set({ rate: v })} />
        <SelectField label="Interest rate type" value={form.interestRateType} onChange={(v) => set({ interestRateType: v })} options={['variable', 'fixed', 'flat'].map((v) => ({ value: v, label: v }))} />
        <TextField label="Currency" value={form.currency} onChange={(v) => set({ currency: v })} />
      </div>

      <div className="border-t pt-4" style={{ borderColor: 'var(--color-adm-border)' }}>
        <h3 className="font-semibold text-sm mb-3">Doc charge</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <SelectField label="Basis" value={form.docChargeBasis} onChange={(v) => set({ docChargeBasis: v })} options={[{ value: 'percent', label: 'Percent of loan' }, { value: 'fixed', label: 'Fixed amount' }]} />
          <TextField label={form.docChargeBasis === 'fixed' ? 'Amount (LKR)' : 'Value (%)'} type="number" value={form.docChargeValue} onChange={(v) => set({ docChargeValue: v })} />
          <TextField label="Min (LKR)" type="number" value={form.docChargeMin} onChange={(v) => set({ docChargeMin: v })} />
          <TextField label="Max (LKR)" type="number" value={form.docChargeMax} onChange={(v) => set({ docChargeMax: v })} />
        </div>
      </div>

      <div className="border-t pt-4" style={{ borderColor: 'var(--color-adm-border)' }}>
        <h3 className="font-semibold text-sm mb-3">Affordability</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <TextField label="Max term (years)" type="number" value={form.maxTermYears} onChange={(v) => set({ maxTermYears: v })} />
          <TextField label="DTI override (%, optional)" type="number" value={form.dtiOverride} onChange={(v) => set({ dtiOverride: v })} />
          <TextField label="Other income % considered" type="number" value={form.otherIncomePct} onChange={(v) => set({ otherIncomePct: v })} />
          <TextField label="Min net monthly income" type="number" value={form.minNetMonthlyIncome} onChange={(v) => set({ minNetMonthlyIncome: v })} />
          <TextField label="Loan amount min" type="number" value={form.loanAmountMin} onChange={(v) => set({ loanAmountMin: v })} />
          <TextField label="Loan amount max" type="number" value={form.loanAmountMax} onChange={(v) => set({ loanAmountMax: v })} />
        </div>
        <div className="flex gap-4 mt-3">
          <CheckboxField label="OT income included" checked={form.otIncluded} onChange={(v) => set({ otIncluded: v })} />
        </div>
      </div>

      <div className="border-t pt-4" style={{ borderColor: 'var(--color-adm-border)' }}>
        <h3 className="font-semibold text-sm mb-3">Eligibility targeting</h3>
        <div className="flex gap-4 mb-3">
          <CheckboxField label="Common loan (open to all)" checked={form.commonLoan} onChange={(v) => set({ commonLoan: v })} />
        </div>
        {!form.commonLoan && (
          <>
            <label className="field-label">Target occupations</label>
            <div className="flex flex-wrap gap-2 mb-3">
              <button type="button" onClick={() => set({ targetOccupation: 'all' })} className={`admin-badge ${isAllOccupations ? 'admin-badge-active' : 'admin-badge-inactive'}`}>All</button>
              {occupations.map((o) => (
                <button
                  key={o.id} type="button" onClick={() => toggleOccupation(o.id)}
                  className={`admin-badge ${!isAllOccupations && targetOccList.includes(o.id) ? 'admin-badge-active' : 'admin-badge-inactive'}`}
                >
                  {o.label}
                </button>
              ))}
            </div>
            <SelectField
              label="Target gender" value={form.targetGender} onChange={(v) => set({ targetGender: v })}
              options={[{ value: 'all', label: 'All' }, { value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }]}
            />
          </>
        )}

        <div className="grid sm:grid-cols-2 gap-4 mt-3">
          <TextField label="Age min" type="number" value={form.ageMin} onChange={(v) => set({ ageMin: v })} />
          <TextField label="Age max at maturity" type="number" value={form.ageMaxAtMaturity} onChange={(v) => set({ ageMaxAtMaturity: v })} />
          <TextField label="Min employment (months)" type="number" value={form.minEmploymentMonths} onChange={(v) => set({ minEmploymentMonths: v })} />
        </div>

        <div className="mt-3">
          <CheckboxField label="Requires approved employer/company list" checked={form.companiesListRequired} onChange={(v) => set({ companiesListRequired: v })} />
          {form.companiesListRequired && (
            <div className="mt-2">
              <SelectField
                label="Which list" value={form.companiesListId} onChange={(v) => set({ companiesListId: v })}
                options={[{ value: '', label: 'Select a list' }, ...relevantLists.map((l) => ({ value: l.id, label: l.name }))]}
              />
            </div>
          )}
        </div>
      </div>

      <div className="border-t pt-4" style={{ borderColor: 'var(--color-adm-border)' }}>
        <h3 className="font-semibold text-sm mb-3">Terms & conditions</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <SelectField label="Guarantor required" value={form.guarantorRequired} onChange={(v) => set({ guarantorRequired: v })} options={[{ value: 'no', label: 'No' }, { value: '1', label: '1' }, { value: '2', label: '2' }]} />
          <TextField label="Collateral" value={form.collateralRequired} onChange={(v) => set({ collateralRequired: v })} />
          <TextField label="Insurance" value={form.insuranceRequired} onChange={(v) => set({ insuranceRequired: v })} />
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

      <div className="border-t pt-4" style={{ borderColor: 'var(--color-adm-border)' }}>
        <h3 className="font-semibold text-sm mb-3">Remarks</h3>
        <ul className="mb-2 space-y-1">
          {(form.remarks || []).map((r, i) => (
            <li key={i} className="flex items-center justify-between text-sm admin-card px-3 py-2">
              <span>{r}</span>
              <button onClick={() => removeRemark(i)} className="text-xs" style={{ color: 'var(--color-adm-danger)' }}>Remove</button>
            </li>
          ))}
        </ul>
        <div className="flex gap-2">
          <input className="admin-input" placeholder="Add a remark" value={remarkDraft} onChange={(e) => setRemarkDraft(e.target.value)} />
          <button onClick={addRemark} className="admin-btn-ghost px-4">Add</button>
        </div>
      </div>
    </Drawer>
  );
}
