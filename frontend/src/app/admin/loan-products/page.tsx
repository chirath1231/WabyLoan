'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useAdminBanks } from '@/hooks/useAdminBanks';
import { useAdminLoanProducts, useCreateLoanProduct, useUpdateLoanProduct, type AdminLoanProduct } from '@/hooks/useAdminLoanProducts';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { TextInput } from '@/components/ui/Field';
import { LoanProductForm } from '@/components/admin/LoanProductForm';

const CATEGORY_LABELS: Record<string, string> = {
  personal: 'Personal',
  housing: 'Housing',
  vehicle_leasing: 'Vehicle Leasing',
  education: 'Education',
  business: 'Business',
  pensioner: 'Pensioner',
};

export default function AdminLoanProductsPage() {
  const { data: banks = [] } = useAdminBanks();
  const [bankFilter, setBankFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const { data: products = [], isLoading } = useAdminLoanProducts(bankFilter === 'all' ? undefined : bankFilter);
  const createProduct = useCreateLoanProduct();
  const updateProduct = useUpdateLoanProduct();
  const [editing, setEditing] = useState<AdminLoanProduct | 'new' | null>(null);

  const bankName = (id: string) => banks.find((b) => b.id === id)?.name ?? id;

  const filteredProducts = products.filter((p) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return p.name.toLowerCase().includes(q) || bankName(p.bankId).toLowerCase().includes(q);
  });

  function handleSave(data: Partial<AdminLoanProduct>) {
    if (editing === 'new') {
      createProduct.mutate(data, { onSuccess: () => setEditing(null) });
    } else if (editing) {
      updateProduct.mutate({ id: editing.id, data }, { onSuccess: () => setEditing(null) });
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-text-900">Loan Products</h1>
        <Button onClick={() => setEditing('new')}>
          <Plus size={15} /> Add Loan Product
        </Button>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <TextInput placeholder="Search by product or bank name…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
        <div className="max-w-xs">
          <Select
            value={bankFilter}
            onChange={setBankFilter}
            options={[{ value: 'all', label: 'All Banks' }, ...banks.map((b) => ({ value: b.id, label: b.name }))]}
          />
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-text-600">Loading…</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-line bg-card">
          <table className="w-full text-sm">
            <thead className="bg-teal-50 text-left text-[11px] uppercase text-text-600">
              <tr>
                <th className="px-4 py-2.5">Bank</th>
                <th className="px-4 py-2.5">Product Name</th>
                <th className="px-4 py-2.5">Category</th>
                <th className="px-4 py-2.5">Interest Rate</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((p) => (
                <tr key={p.id} className="border-t border-line">
                  <td className="px-4 py-2.5 text-text-600">{bankName(p.bankId)}</td>
                  <td className="px-4 py-2.5 font-semibold text-text-900">{p.name}</td>
                  <td className="px-4 py-2.5 text-text-600">{CATEGORY_LABELS[p.category] ?? p.category}</td>
                  <td className="px-4 py-2.5 font-mono">{p.interestRatePct}%</td>
                  <td className="px-4 py-2.5">
                    <Badge tone={p.active ? 'teal' : 'grey'}>{p.active ? 'Active' : 'Inactive'}</Badge>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <button onClick={() => setEditing(p)} className="text-[12.5px] font-semibold text-teal-700 hover:underline">
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-text-400">
                    {products.length === 0 ? 'No loan products yet.' : 'No loan products match this search.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <Modal open onOpenChange={(v) => !v && setEditing(null)} title={editing === 'new' ? 'Add Loan Product' : `Edit ${editing.name}`} wide>
          <LoanProductForm
            initial={editing === 'new' ? undefined : editing}
            onSave={handleSave}
            onCancel={() => setEditing(null)}
            saving={createProduct.isPending || updateProduct.isPending}
            saveError={createProduct.isError || updateProduct.isError ? "Couldn't save — try again." : null}
          />
        </Modal>
      )}
    </div>
  );
}
