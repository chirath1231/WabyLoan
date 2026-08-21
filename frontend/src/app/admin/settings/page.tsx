'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useAdminSettings, useResetToDefaults, useUpdateAdminSettings, type AdminSettings } from '@/hooks/useAdminSettings';
import { Label, Hint, TextInput } from '@/components/ui/Field';
import { Switch } from '@/components/ui/Switch';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

const ROUNDING_OPTIONS = [
  { value: '0', label: 'Exact (no rounding)' },
  { value: '10000', label: 'Nearest LKR 10,000' },
  { value: '50000', label: 'Nearest LKR 50,000' },
  { value: '100000', label: 'Nearest LKR 100,000' },
];

export default function AdminSettingsPage() {
  const { data, isLoading } = useAdminSettings();
  const update = useUpdateAdminSettings();
  const reset = useResetToDefaults();
  const [form, setForm] = useState<Partial<AdminSettings>>({});
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  function set<K extends keyof AdminSettings>(key: K, value: AdminSettings[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function save() {
    update.mutate(form);
  }

  if (isLoading || !form) return <p className="text-sm text-text-600">Loading…</p>;

  return (
    <div className="max-w-2xl space-y-8">
      <h1 className="font-display text-2xl font-bold text-text-900">Global Settings</h1>

      <section className="space-y-3 rounded-2xl border border-line bg-white p-5">
        <p className="font-display text-sm font-bold text-text-900">DTI thresholds per sector</p>
        <Hint>Internal risk metric — never surfaced to end users.</Hint>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {(
            [
              ['dtiGovernment', 'Government'],
              ['dtiSemiGovernment', 'Semi-Gov.'],
              ['dtiPrivate', 'Private'],
              ['dtiSelfEmployed', 'Self-Employed'],
            ] as const
          ).map(([key, label]) => (
            <div key={key}>
              <Label>{label} (%)</Label>
              <TextInput type="number" value={form[key] ?? ''} onChange={(e) => set(key, Number(e.target.value))} />
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3 rounded-2xl border border-line bg-white p-5">
        <p className="font-display text-sm font-bold text-text-900">Professional discounts</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label>General Scheme courtesy discount (pp)</Label>
            <TextInput type="number" step="0.01" value={form.specialOccupationDiscount ?? ''} onChange={(e) => set('specialOccupationDiscount', e.target.value as never)} />
            <Switch checked={!!form.specialOccupationEnabled} onCheckedChange={(v) => set('specialOccupationEnabled', v)} label="Enabled" />
          </div>
          <div>
            <Label>Special Scheme discount (pp)</Label>
            <TextInput type="number" step="0.01" value={form.professionalSchemeDiscount ?? ''} onChange={(e) => set('professionalSchemeDiscount', e.target.value as never)} />
            <Switch checked={!!form.professionalSchemeEnabled} onCheckedChange={(v) => set('professionalSchemeEnabled', v)} label="Enabled (master switch)" />
          </div>
        </div>
      </section>

      <section className="space-y-3 rounded-2xl border border-line bg-white p-5">
        <p className="font-display text-sm font-bold text-text-900">Loan Amount Rounding Step</p>
        <Select value={String(form.loanRoundingStep ?? 50000)} onChange={(v) => set('loanRoundingStep', Number(v))} options={ROUNDING_OPTIONS} />
      </section>

      <section className="space-y-3 rounded-2xl border border-line bg-white p-5">
        <p className="font-display text-sm font-bold text-text-900">Feature Flags</p>
        <Switch checked={!!form.businessLoanEnabled} onCheckedChange={(v) => set('businessLoanEnabled', v)} label="Business Loan category enabled" />
      </section>

      <div className="flex items-center justify-between">
        <Button onClick={save} disabled={update.isPending}>
          Save Settings
        </Button>
        <Button variant="danger" onClick={() => setConfirmOpen(true)}>
          <AlertTriangle size={15} /> Reset to Defaults
        </Button>
      </div>

      <Modal open={confirmOpen} onOpenChange={setConfirmOpen} title="Reset to shipped defaults?">
        <p className="text-sm text-text-600">
          This restores all bank records, the occupation list, DTI thresholds, discount percentages, and feature flags to their shipped baseline. This cannot be undone.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirmOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => reset.mutate(undefined, { onSuccess: () => setConfirmOpen(false) })}
            disabled={reset.isPending}
          >
            Yes, reset everything
          </Button>
        </div>
      </Modal>
    </div>
  );
}
