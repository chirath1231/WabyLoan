import { useState } from 'react';
import Drawer from './components/Drawer.jsx';
import ProductDrawer from './ProductDrawer.jsx';
import { TextField, SelectField, CheckboxField } from './components/Field.jsx';
import { api } from '../api/client.js';

const SECTORS = ['government', 'semi_government', 'private', 'self_employed'];
const LOAN_CATEGORIES = ['personal', 'professional', 'housing', 'vehicle', 'business', 'pension'];

function emptyBank() {
  return {
    id: '', name: '', short: '', type: 'bank', active: true, sponsored: false,
    baseRate: 10, maxTermYears: { personal: 5, professional: 7, housing: 25, vehicle: 7, business: 6, pension: 5 },
    docChargePct: 0.75, docChargeMin: 2000, docChargeCap: 25000, color: '#00695C',
    allowedSectors: [...SECTORS], targetOccupation: 'all',
    remarks: [], specialSchemeRemarks: [], specialRate: null, specialDocChargePct: null, specialMaxTermYears: null,
  };
}

export default function BankDrawer({ bank, companyLists, onClose, onSaved }) {
  const isNew = !bank;
  const [form, setForm] = useState(() => (bank ? { ...emptyBank(), ...bank } : emptyBank()));
  const [saving, setSaving] = useState(false);
  const [productDrawer, setProductDrawer] = useState(null); // { product } | { new: true } | null

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const setTermYears = (cat, v) => set({ maxTermYears: { ...form.maxTermYears, [cat]: v } });
  const toggleSector = (s) => {
    const has = form.allowedSectors.includes(s);
    set({ allowedSectors: has ? form.allowedSectors.filter((x) => x !== s) : [...form.allowedSectors, s] });
  };

  const save = async () => {
    setSaving(true);
    try {
      if (isNew) {
        await api.post('/admin/banks', form);
      } else {
        await api.put(`/admin/banks/${bank.id}`, form);
      }
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  const deleteProduct = async (product) => {
    if (!confirm(`Delete "${product.name}"?`)) return;
    await api.delete(`/admin/banks/${bank.id}/products/${product.dbId}`);
    onSaved();
  };

  return (
    <>
      <Drawer title={isNew ? 'Add Bank' : `Edit: ${bank.name}`} onClose={onClose} onSave={save} saving={saving} wide>
        <div className="grid sm:grid-cols-2 gap-4">
          {isNew && <TextField label="Bank ID (slug)" value={form.id} onChange={(v) => set({ id: v.toLowerCase().replace(/[^a-z0-9_]/g, '') })} hint="Lowercase, no spaces — used internally, can't change later." />}
          <TextField label="Full name" value={form.name} onChange={(v) => set({ name: v })} />
          <TextField label="Short name" value={form.short} onChange={(v) => set({ short: v })} />
          <SelectField label="Type" value={form.type} onChange={(v) => set({ type: v })} options={[{ value: 'bank', label: 'Bank' }, { value: 'finance', label: 'Finance company' }]} />
          <TextField label="Base rate (%)" type="number" value={form.baseRate} onChange={(v) => set({ baseRate: v })} />
          <TextField label="Brand color" value={form.color} onChange={(v) => set({ color: v })} />
        </div>

        <div className="flex gap-4">
          <CheckboxField label="Active" checked={form.active} onChange={(v) => set({ active: v })} />
          <CheckboxField label="Sponsored" checked={form.sponsored} onChange={(v) => set({ sponsored: v })} />
        </div>

        <div className="border-t pt-4" style={{ borderColor: 'var(--color-adm-border)' }}>
          <h3 className="font-semibold text-sm mb-3">Doc charge (general facility)</h3>
          <div className="grid sm:grid-cols-3 gap-4">
            <TextField label="Doc charge %" type="number" value={form.docChargePct} onChange={(v) => set({ docChargePct: v })} />
            <TextField label="Min (LKR)" type="number" value={form.docChargeMin} onChange={(v) => set({ docChargeMin: v })} />
            <TextField label="Cap (LKR)" type="number" value={form.docChargeCap} onChange={(v) => set({ docChargeCap: v })} />
          </div>
        </div>

        <div className="border-t pt-4" style={{ borderColor: 'var(--color-adm-border)' }}>
          <h3 className="font-semibold text-sm mb-3">Max term by category (years)</h3>
          <div className="grid sm:grid-cols-3 gap-4">
            {LOAN_CATEGORIES.map((cat) => (
              <TextField key={cat} label={cat} type="number" value={form.maxTermYears[cat]} onChange={(v) => setTermYears(cat, v)} />
            ))}
          </div>
        </div>

        <div className="border-t pt-4" style={{ borderColor: 'var(--color-adm-border)' }}>
          <h3 className="font-semibold text-sm mb-3">Allowed sectors</h3>
          <div className="flex flex-wrap gap-2">
            {SECTORS.map((s) => (
              <button key={s} type="button" onClick={() => toggleSector(s)} className={`admin-badge ${form.allowedSectors.includes(s) ? 'admin-badge-active' : 'admin-badge-inactive'}`}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {!isNew && (
          <div className="border-t pt-4" style={{ borderColor: 'var(--color-adm-border)' }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm">Specialty products ({(bank.products || []).length})</h3>
              <button onClick={() => setProductDrawer({ isNew: true })} className="admin-btn-primary px-3 py-1.5 text-sm">+ Add Product</button>
            </div>
            <div className="space-y-2">
              {(bank.products || []).map((p) => (
                <div key={p.dbId} className="admin-card p-3 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-sm">{p.name}</div>
                    <div className="hint">{p.category} · {p.rate}% · {p.status}</div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setProductDrawer({ product: p })} className="admin-btn-ghost px-3 py-1.5 text-xs">Edit</button>
                    <button onClick={() => deleteProduct(p)} className="admin-btn-ghost px-3 py-1.5 text-xs" style={{ color: 'var(--color-adm-danger)' }}>Delete</button>
                  </div>
                </div>
              ))}
              {!(bank.products || []).length && <p className="hint">No specialty products yet — this bank only offers its general facility.</p>}
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
