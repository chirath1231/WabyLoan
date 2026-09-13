import { useEffect, useState } from 'react';
import { TextField, CheckboxField } from './components/Field.jsx';
import { api } from '../api/client.js';

const SECTOR_LABELS = { government: 'Government', semi_government: 'Semi-Government', private: 'Private', self_employed: 'Self-Employed' };

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = () => api.get('/admin/settings').then(({ data }) => setSettings(data.settings));
  useEffect(() => { load(); }, []);

  if (!settings) return <p style={{ color: 'var(--color-adm-text-dim)' }}>Loading…</p>;

  const set = (patch) => setSettings((s) => ({ ...s, ...patch }));
  const setDti = (sector, v) => setSettings((s) => ({ ...s, dti: { ...s.dti, [sector]: v } }));

  const save = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await api.put('/admin/settings', settings);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  const exportJson = async () => {
    const [banks, occupations, companyLists] = await Promise.all([
      api.get('/admin/banks'), api.get('/admin/occupations'), api.get('/admin/company-lists'),
    ]);
    const blob = new Blob([JSON.stringify({
      banks: banks.data.banks, occupations: occupations.data.occupations,
      companyLists: companyLists.data.companyLists, settings,
    }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'waby-loan-export.json'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <h1 className="font-display font-bold text-xl mb-5">Settings</h1>

      <div className="admin-card p-5 mb-5">
        <h3 className="font-semibold text-sm mb-3">Per-sector DTI ceiling (%)</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(SECTOR_LABELS).map(([key, label]) => (
            <TextField key={key} label={label} type="number" value={settings.dti[key]} onChange={(v) => setDti(key, v)} />
          ))}
        </div>
      </div>

      <div className="admin-card p-5 mb-5">
        <h3 className="font-semibold text-sm mb-3">General</h3>
        <div className="grid sm:grid-cols-2 gap-4 mb-3">
          <TextField label="Loan rounding step (LKR)" type="number" value={settings.loanRoundingStep} onChange={(v) => set({ loanRoundingStep: v })} />
          <TextField label="Pension max age" type="number" value={settings.pensionMaxAge} onChange={(v) => set({ pensionMaxAge: v })} />
        </div>
        <CheckboxField label="Business Loan category enabled" checked={settings.businessLoanEnabled} onChange={(v) => set({ businessLoanEnabled: v })} />
      </div>

      <div className="flex items-center gap-3 mb-5">
        <button onClick={save} disabled={saving} className="admin-btn-primary h-11 px-6">{saving ? 'Saving…' : 'Save Settings'}</button>
        {saved && <span className="text-sm" style={{ color: 'var(--color-adm-accent-2)' }}>Saved ✓</span>}
      </div>

      <div className="admin-card p-5">
        <h3 className="font-semibold text-sm mb-3">Data management</h3>
        <button onClick={exportJson} className="admin-btn-ghost px-4 py-2 text-sm">Export JSON (banks, products, occupations, company lists, settings)</button>
      </div>
    </div>
  );
}
