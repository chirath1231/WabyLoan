'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useAdminBanks, useCreateBank, useUpdateBank, type AdminBank } from '@/hooks/useAdminBanks';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { BankForm } from '@/components/admin/BankForm';

export default function AdminBanksPage() {
  const { data: banks = [], isLoading } = useAdminBanks();
  const createBank = useCreateBank();
  const updateBank = useUpdateBank();
  const [editing, setEditing] = useState<AdminBank | 'new' | null>(null);

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

      {isLoading ? (
        <p className="text-sm text-text-600">Loading…</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-line bg-white">
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
              {banks.map((b) => (
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
          />
        </Modal>
      )}
    </div>
  );
}
