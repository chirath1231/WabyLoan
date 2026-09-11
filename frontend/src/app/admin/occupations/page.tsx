'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useAdminOccupations, useCreateOccupation, useUpdateOccupation } from '@/hooks/useAdminOccupations';
import { Switch } from '@/components/ui/Switch';
import { Button } from '@/components/ui/Button';
import { TextInput, Hint } from '@/components/ui/Field';

export default function AdminOccupationsPage() {
  const { data: occupations = [], isLoading } = useAdminOccupations();
  const createOcc = useCreateOccupation();
  const updateOcc = useUpdateOccupation();
  const [newLabel, setNewLabel] = useState('');

  function addOccupation() {
    const label = newLabel.trim();
    if (!label) return;
    const slug = label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
    createOcc.mutate({ slug, label, isSpecialSchemeEligible: false }, { onSuccess: () => setNewLabel('') });
  }

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-bold text-text-900">Occupations</h1>
      <p className="mb-4 text-[13px] text-text-600">
        This list drives the Step 2 dropdown and determines which applicants trigger the dual-scheme Professional Loan comparison.
      </p>

      {isLoading ? (
        <p className="text-sm text-text-600">Loading…</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-line bg-card">
          <table className="w-full text-sm">
            <thead className="bg-teal-50 text-left text-[11px] uppercase text-text-600">
              <tr>
                <th className="px-4 py-2.5">Label</th>
                <th className="px-4 py-2.5">Eligible for professional discount/scheme</th>
              </tr>
            </thead>
            <tbody>
              {occupations.map((o) => (
                <tr key={o.id} className="border-t border-line">
                  <td className="px-4 py-2.5">
                    <TextInput
                      value={o.label}
                      onChange={(e) => updateOcc.mutate({ id: o.id, data: { label: e.target.value } })}
                      className="max-w-xs"
                    />
                  </td>
                  <td className="px-4 py-2.5">
                    <Switch checked={o.isSpecialSchemeEligible} onCheckedChange={(v) => updateOcc.mutate({ id: o.id, data: { isSpecialSchemeEligible: v } })} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 flex items-center gap-2">
        <TextInput placeholder="New occupation label" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} className="max-w-xs" />
        <Button onClick={addOccupation} disabled={createOcc.isPending}>
          <Plus size={15} /> Add
        </Button>
      </div>
      {(createOcc.isError || updateOcc.isError) && <Hint tone="danger">Couldn&apos;t save — try again.</Hint>}
    </div>
  );
}
