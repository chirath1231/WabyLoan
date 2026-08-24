'use client';

import { useState } from 'react';
import type { AdminBank } from '@/hooks/useAdminBanks';
import { Label, Hint, TextInput } from '@/components/ui/Field';
import { Switch } from '@/components/ui/Switch';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';

const SECTORS = [
  { value: 'government', label: 'Government' },
  { value: 'semi_government', label: 'Semi-Government' },
  { value: 'private', label: 'Private' },
  { value: 'self_employed', label: 'Self-Employed' },
];

const TARGET_OCC = [
  { value: 'all', label: 'All Occupations' },
  { value: 'doctor', label: 'Doctors Only' },
  { value: 'engineer', label: 'Engineers Only' },
  { value: 'gov_exec', label: 'Government Executives Only' },
];

const TERM_FIELDS: { key: keyof AdminBank; label: string }[] = [
  { key: 'maxTermPersonal', label: 'Personal' },
  { key: 'maxTermProfessional', label: 'Professional' },
  { key: 'maxTermHousing', label: 'Housing' },
  { key: 'maxTermVehicle', label: 'Vehicle' },
  { key: 'maxTermBusiness', label: 'Business' },
];

const DEFAULTS: Partial<AdminBank> = {
  name: '',
  shortName: '',
  type: 'bank',
  active: true,
  sponsored: false,
  baseRate: 12,
  docChargePct: 0.75,
  docChargeMin: 2000,
  docChargeCap: 25000,
  maxTermPersonal: 5,
  maxTermProfessional: 5,
  maxTermHousing: 0,
  maxTermVehicle: 0,
  maxTermBusiness: 0,
  specialRate: null,
  specialDocChargePct: null,
  specialMaxTermYears: null,
  allowedSectors: ['government', 'semi_government', 'private', 'self_employed'],
  targetOccupation: 'all',
  remarks: [],
  specialSchemeRemarks: [],
  color: '#00695C',
  updatedDate: new Date().toISOString().slice(0, 10),
};

export function BankForm({ initial, onSave, onCancel, saving }: { initial?: AdminBank; onSave: (data: Partial<AdminBank>) => void; onCancel: () => void; saving?: boolean }) {
  const [form, setForm] = useState<Partial<AdminBank>>({ ...DEFAULTS, ...initial });
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof AdminBank>(key: K, value: AdminBank[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggleSector(s: string) {
    const current = form.allowedSectors ?? [];
    const next = current.includes(s) ? current.filter((x) => x !== s) : [...current, s];
    set('allowedSectors', next);
  }

  function submit() {
    if (!form.allowedSectors || form.allowedSectors.length === 0) {
      setError('At least one sector must remain checked.');
      return;
    }
    setError(null);
    onSave({
      ...form,
      baseRate: Number(form.baseRate),
      docChargePct: Number(form.docChargePct),
      specialRate: form.specialRate === '' || form.specialRate == null ? null : Number(form.specialRate),
      specialDocChargePct: form.specialDocChargePct === '' || form.specialDocChargePct == null ? null : Number(form.specialDocChargePct),
      specialMaxTermYears: form.specialMaxTermYears == null || (form.specialMaxTermYears as unknown) === '' ? null : Number(form.specialMaxTermYears),
    });
  }

  return (
    <div className="space-y-6">
      {/* General Scheme Parameters — teal */}
      <section className="space-y-4 rounded-2xl border border-teal-100 bg-teal-50/40 p-4">
        <p className="font-display text-sm font-bold text-teal-800">General Scheme Parameters</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label>Bank / Lender Name</Label>
            <TextInput value={form.name ?? ''} onChange={(e) => set('name', e.target.value)} />
          </div>
          <div>
            <Label>Short Label</Label>
            <TextInput value={form.shortName ?? ''} onChange={(e) => set('shortName', e.target.value)} />
          </div>
          <div>
            <Label>Type</Label>
            <Select value={form.type ?? 'bank'} onChange={(v) => set('type', v as AdminBank['type'])} options={[{ value: 'bank', label: 'Bank' }, { value: 'finance', label: 'Finance Company' }]} />
          </div>
          <div>
            <Label>Base Rate (%)</Label>
            <TextInput type="number" step="0.01" value={form.baseRate ?? ''} onChange={(e) => set('baseRate', e.target.value as never)} />
          </div>
          <div>
            <Label>Document Charge (%)</Label>
            <TextInput type="number" step="0.01" value={form.docChargePct ?? ''} onChange={(e) => set('docChargePct', e.target.value as never)} />
          </div>
          <div />
          <div>
            <Label>Document Charge Min (LKR)</Label>
            <TextInput type="number" value={form.docChargeMin ?? ''} onChange={(e) => set('docChargeMin', Number(e.target.value))} />
          </div>
          <div>
            <Label>Document Charge Cap (LKR)</Label>
            <TextInput type="number" value={form.docChargeCap ?? ''} onChange={(e) => set('docChargeCap', Number(e.target.value))} />
          </div>
        </div>

        <div>
          <Label>Max Term per loan category (years, 0 = not offered)</Label>
          <div className="grid grid-cols-5 gap-2">
            {TERM_FIELDS.map((f) => (
              <div key={f.key}>
                <TextInput type="number" value={(form[f.key] as number) ?? 0} onChange={(e) => set(f.key, Number(e.target.value) as never)} />
                <p className="mt-1 text-center text-[11px] text-text-400">{f.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <Label>General Scheme remarks / guarantor conditions (one per line)</Label>
          <textarea
            className="w-full rounded-[10px] border-[1.5px] border-line bg-card px-3 py-2.5 text-sm"
            rows={3}
            value={(form.remarks ?? []).join('\n')}
            onChange={(e) => set('remarks', e.target.value.split('\n').filter(Boolean))}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label>Rates Effective Date</Label>
            <TextInput type="date" value={form.updatedDate ?? ''} onChange={(e) => set('updatedDate', e.target.value)} />
          </div>
          <div className="flex items-center gap-6 pt-6">
            <Switch checked={!!form.active} onCheckedChange={(v) => set('active', v)} label="Active" />
            <Switch checked={!!form.sponsored} onCheckedChange={(v) => set('sponsored', v)} label="Sponsored" />
          </div>
        </div>
      </section>

      {/* Special / Professional Scheme Overrides — violet */}
      <section className="space-y-4 rounded-2xl border border-violet-100 bg-violet-100/20 p-4">
        <p className="font-display text-sm font-bold text-violet-700">Special / Professional Scheme Overrides</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <Label>Special Scheme Rate (%)</Label>
            <TextInput type="number" step="0.01" placeholder="blank = auto" value={form.specialRate ?? ''} onChange={(e) => set('specialRate', (e.target.value === '' ? null : e.target.value) as never)} />
            <Hint>Blank falls back to Base Rate − the global professional scheme discount.</Hint>
          </div>
          <div>
            <Label>Special Document Charge (%)</Label>
            <TextInput type="number" step="0.01" placeholder="blank = general" value={form.specialDocChargePct ?? ''} onChange={(e) => set('specialDocChargePct', (e.target.value === '' ? null : e.target.value) as never)} />
            <Hint>Blank falls back to the General doc charge.</Hint>
          </div>
          <div>
            <Label>Special Max Term (years)</Label>
            <TextInput type="number" placeholder="blank = professional cap" value={form.specialMaxTermYears ?? ''} onChange={(e) => set('specialMaxTermYears', (e.target.value === '' ? null : e.target.value) as never)} />
            <Hint>Blank falls back to the Professional value in the General term grid.</Hint>
          </div>
        </div>
        <div>
          <Label>Special / Professional Scheme remarks (one per line, leave blank if none)</Label>
          <textarea
            className="w-full rounded-[10px] border-[1.5px] border-line bg-card px-3 py-2.5 text-sm"
            rows={3}
            value={(form.specialSchemeRemarks ?? []).join('\n')}
            onChange={(e) => set('specialSchemeRemarks', e.target.value.split('\n').filter(Boolean))}
          />
        </div>
      </section>

      {/* Target Eligibility Criteria */}
      <section className="space-y-4 rounded-2xl border border-line p-4">
        <p className="font-display text-sm font-bold text-text-900">Target Eligibility Criteria</p>
        <div>
          <Label>Allowed employment sectors</Label>
          <div className="flex flex-wrap gap-3">
            {SECTORS.map((s) => (
              <label key={s.value} className="flex items-center gap-1.5 text-sm">
                <input type="checkbox" className="h-4 w-4 accent-teal-700" checked={(form.allowedSectors ?? []).includes(s.value)} onChange={() => toggleSector(s.value)} />
                {s.label}
              </label>
            ))}
          </div>
          {error && <Hint tone="danger">{error}</Hint>}
        </div>
        <div className="max-w-xs">
          <Label>Target occupation restriction (Special Scheme only)</Label>
          <Select value={form.targetOccupation ?? 'all'} onChange={(v) => set('targetOccupation', v as never)} options={TARGET_OCC} />
        </div>
      </section>

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
