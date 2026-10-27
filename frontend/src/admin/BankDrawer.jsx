import { useState } from 'react';
import Drawer from './components/Drawer.jsx';
import RemarksEditor from './components/RemarksEditor.jsx';
import ProductDrawer, { rateSummary } from './ProductDrawer.jsx';
import Field, { TextField, SelectField, CheckboxField } from './components/Field.jsx';
import { useLookups, toOptions } from './useLookups.js';
import { api, apiErrorMessage } from '../api/client.js';

function emptyBank(lookups) {
  return {
    code: '', name: '', short: '', type: 'bank', active: true, sponsored: false,
    baseRate: 10, docChargePct: 0.75, docChargeMin: 2000, docChargeCap: 25000, color: '#00695C',
    logoUrl: '', websiteUrl: '', email: '', hotline: '', phone: '', whatsapp: '', address: '', branchLocatorUrl: '',
    ratesEffectiveDate: null,
    maxTermYears: {},
    allowedSectors: (lookups?.sectors || []).map((s) => s.id),
    remarks: [],
  };
}

// Only the editable columns + child collections go back to the API (not products / ids / timestamps).
function payload(form) {
  const { products, id, updatedAt, ...rest } = form;
  return rest;
}

export default function BankDrawer({ bank, companyLists, onClose, onSaved }) {
  const lookups = useLookups();
  const isNew = !bank;
  const [form, setForm] = useState(() => (bank ? { ...emptyBank(null), ...bank } : emptyBank(lookups)));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [productDrawer, setProductDrawer] = useState(null); // { product } | { isNew: true } | null

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const setTermYears = (cat, v) => set({ maxTermYears: { ...form.maxTermYears, [cat]: v } });
  const toggleSector = (s) => {
    const has = form.allowedSectors.includes(s);
    set({ allowedSectors: has ? form.allowedSectors.filter((x) => x !== s) : [...form.allowedSectors, s] });
  };

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      if (isNew) await api.post('/admin/banks', payload(form));
      else await api.put(`/admin/banks/${bank.id}`, payload(form));
      onSaved();
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not save the bank.'));
    } finally {
      setSaving(false);
    }
  };

  const deleteProduct = async (product) => {
    if (!confirm(`Delete "${product.name}"?`)) return;
    await api.delete(`/admin/banks/${bank.id}/products/${product.dbId}`);
    onSaved();
  };

  const section = { borderColor: 'var(--color-adm-border)' };

  return (
    <>
      <Drawer title={isNew ? 'Add Bank' : `Edit: ${bank.name}`} onClose={onClose} onSave={save} saving={saving} error={error} wide>
        <div className="grid sm:grid-cols-2 gap-4">
          <TextField
            label="Bank code" value={form.code} onChange={(v) => set({ code: v.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
            hint="Lowercase, no spaces — the bank's stable identifier (banks.bank_code)."
          />
          <TextField label="Full name" value={form.name} onChange={(v) => set({ name: v })} />
          <TextField label="Short name" value={form.short} onChange={(v) => set({ short: v })} />
          <SelectField label="Type" value={form.type} onChange={(v) => set({ type: v })} options={toOptions(lookups?.bankTypes)} />
          <TextField label="Base rate (%)" type="number" value={form.baseRate} onChange={(v) => set({ baseRate: v })} hint="Used only by the synthesized general facility." />
          <Field label="Brand color">
            <div className="flex gap-2">
              <input type="color" value={form.color || '#00695C'} onChange={(e) => set({ color: e.target.value })} className="h-[42px] w-12 rounded-lg" />
              <input className="admin-input" value={form.color || ''} onChange={(e) => set({ color: e.target.value })} />
            </div>
          </Field>
          <TextField label="Rates effective date" type="date" value={form.ratesEffectiveDate?.slice(0, 10)} onChange={(v) => set({ ratesEffectiveDate: v || null })} />
        </div>

        <div className="flex gap-4">
          <CheckboxField label="Active" checked={form.active} onChange={(v) => set({ active: v })} />
          <CheckboxField label="Sponsored (Featured Partner)" checked={form.sponsored} onChange={(v) => set({ sponsored: v })} />
        </div>

        <div className="border-t pt-4" style={section}>
          <h3 className="font-semibold text-sm mb-3">Contact</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <TextField label="Website" value={form.websiteUrl} onChange={(v) => set({ websiteUrl: v })} />
            <TextField label="Email" value={form.email} onChange={(v) => set({ email: v })} />
            <TextField label="Hotline" value={form.hotline} onChange={(v) => set({ hotline: v })} />
            <TextField label="WhatsApp" value={form.whatsapp} onChange={(v) => set({ whatsapp: v })} />
            <TextField label="Branch locator URL" value={form.branchLocatorUrl} onChange={(v) => set({ branchLocatorUrl: v })} />
            {form.logoUrl?.startsWith('data:') ? (
              <Field label="Logo">
                <div className="flex items-center gap-3">
                  <img src={form.logoUrl} alt="" className="h-10 w-10 object-contain rounded" />
                  <button type="button" onClick={() => set({ logoUrl: '' })} className="admin-btn-ghost px-3 py-1.5 text-xs">Replace with URL</button>
                </div>
              </Field>
            ) : (
              <TextField label="Logo URL" value={form.logoUrl} onChange={(v) => set({ logoUrl: v })} />
            )}
          </div>
        </div>

        <div className="border-t pt-4" style={section}>
          <h3 className="font-semibold text-sm mb-3">Doc charge (general facility)</h3>
          <div className="grid sm:grid-cols-3 gap-4">
            <TextField label="Doc charge %" type="number" value={form.docChargePct} onChange={(v) => set({ docChargePct: v })} />
            <TextField label="Min (LKR)" type="number" value={form.docChargeMin} onChange={(v) => set({ docChargeMin: v })} />
            <TextField label="Cap (LKR)" type="number" value={form.docChargeCap} onChange={(v) => set({ docChargeCap: v })} />
          </div>
        </div>

        <div className="border-t pt-4" style={section}>
          <h3 className="font-semibold text-sm mb-3">Max term by category (years)</h3>
          <div className="grid sm:grid-cols-3 gap-4">
            {(lookups?.loanCategories || []).map((cat) => (
              <TextField key={cat.id} label={cat.label} type="number" value={form.maxTermYears[cat.id]} onChange={(v) => setTermYears(cat.id, v)} />
            ))}
          </div>
        </div>

        <div className="border-t pt-4" style={section}>
          <h3 className="font-semibold text-sm mb-3">Allowed sectors</h3>
          <div className="flex flex-wrap gap-2">
            {(lookups?.sectors || []).map((s) => (
              <button key={s.id} type="button" onClick={() => toggleSector(s.id)} className={`admin-badge ${form.allowedSectors.includes(s.id) ? 'admin-badge-active' : 'admin-badge-inactive'}`}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="border-t pt-4" style={section}>
          <h3 className="font-semibold text-sm mb-3">Bank remarks</h3>
          <RemarksEditor remarks={form.remarks} onChange={(remarks) => set({ remarks })} />
        </div>

        {!isNew && (
          <div className="border-t pt-4" style={section}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm">Loan products ({(bank.products || []).length})</h3>
              <button onClick={() => setProductDrawer({ isNew: true })} className="admin-btn-primary px-3 py-1.5 text-sm">+ Add Product</button>
            </div>
            <div className="space-y-2">
              {(bank.products || []).map((p) => (
                <div key={p.dbId} className="admin-card p-3 flex items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold text-sm">{p.name}</div>
                    <div className="hint">{p.category} · {rateSummary(p)} · {p.status}</div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setProductDrawer({ product: p })} className="admin-btn-ghost px-3 py-1.5 text-xs">Edit</button>
                    <button onClick={() => deleteProduct(p)} className="admin-btn-ghost px-3 py-1.5 text-xs" style={{ color: 'var(--color-adm-danger)' }}>Delete</button>
                  </div>
                </div>
              ))}
              {!(bank.products || []).length && <p className="hint">No products yet — this bank only offers its general facility.</p>}
            </div>
          </div>
        )}
      </Drawer>

      {productDrawer && (
        <ProductDrawer
          bankId={bank.id}
          product={productDrawer.product || null}
          companyLists={companyLists}
          onClose={() => setProductDrawer(null)}
          onSaved={() => { setProductDrawer(null); onSaved(); }}
        />
      )}
    </>
  );
}

