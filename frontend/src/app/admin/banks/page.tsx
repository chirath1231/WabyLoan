'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useAdminBanks, useCreateBank, useUpdateBank, type AdminBank } from '@/hooks/useAdminBanks';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { TextInput } from '@/components/ui/Field';
import { BankForm } from '@/components/admin/BankForm';

const TYPE_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'bank', label: 'Banks only' },
  { value: 'finance', label: 'Finance companies only' },
];

export default function AdminBanksPage() {
  const { data: banks = [], isLoading } = useAdminBanks();
  const createBank = useCreateBank();
  const updateBank = useUpdateBank();
  const [editing, setEditing] = useState<AdminBank | 'new' | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const filteredBanks = banks.filter((b) => {
    if (typeFilter !== 'all' && b.type !== typeFilter) return false;
    if (search.trim() && !b.name.toLowerCase().includes(search.trim().toLowerCase())) return false;
    return true;
  });

  function handleSave(data: Partial<AdminBank>) {
    if (editing === 'new') {
      createBank.mutate(data, { onSuccess: () => setEditing(null) });
    } else if (editing) {
      updateBank.mutate({ id: editing.id, data }, { onSuccess: () => setEditing(null) });
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-text-900">Banks</h1>
        <Button onClick={() => setEditing('new')}>
          <Plus size={15} /> Add Bank
        </Button>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <TextInput placeholder="Search by name…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
        <div className="max-w-[220px]">
          <Select value={typeFilter} onChange={setTypeFilter} options={TYPE_FILTERS} />
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-text-600">Loading…</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-line bg-card">
          <table className="w-full text-sm">
            <thead className="bg-teal-50 text-left text-[11px] uppercase text-text-600">
              <tr>
                <th className="px-4 py-2.5">Name</th>
                <th className="px-4 py-2.5">Type</th>
                <th className="px-4 py-2.5">Base Rate</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {filteredBanks.map((b) => (
                <tr key={b.id} className="border-t border-line">
                  <td className="px-4 py-2.5 font-semibold text-text-900">{b.name}</td>
                  <td className="px-4 py-2.5 capitalize text-text-600">{b.type}</td>
                  <td className="px-4 py-2.5 font-mono">{b.baseRate}%</td>
                  <td className="px-4 py-2.5">
                    <div className="flex gap-1.5">
                      <Badge tone={b.active ? 'teal' : 'grey'}>{b.active ? 'Active' : 'Inactive'}</Badge>
                      {b.sponsored && <Badge tone="gold">Sponsored</Badge>}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <button onClick={() => setEditing(b)} className="text-[12.5px] font-semibold text-teal-700 hover:underline">
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
              {filteredBanks.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-text-400">
                    No banks match this search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <Modal open onOpenChange={(v) => !v && setEditing(null)} title={editing === 'new' ? 'Add Bank' : `Edit ${editing.name}`} wide>
          <BankForm
            initial={editing === 'new' ? undefined : editing}
            onSave={handleSave}
            onCancel={() => setEditing(null)}
            saving={createBank.isPending || updateBank.isPending}
            saveError={createBank.isError || updateBank.isError ? "Couldn't save — try again." : null}
          />
        </Modal>
      )}
    </div>
  );
}
