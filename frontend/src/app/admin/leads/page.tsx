'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/apiClient';
import { Badge } from '@/components/ui/Badge';
import { fmtLkr } from '@/lib/format';

interface LeadRow {
  id: string;
  type: 'full' | 'callback';
  name: string;
  phone: string;
  city: string | null;
  bankName: string | null;
  loanCategory: string;
  requestedAmount: number | null;
  createdAt: string;
}

export default function AdminLeadsPage() {
  const { data: leads = [], isLoading } = useQuery<LeadRow[]>({ queryKey: ['admin', 'leads'], queryFn: () => api.get('/admin/leads') });

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-bold text-text-900">Leads</h1>
      {isLoading ? (
        <p className="text-sm text-text-600">Loading…</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-line bg-card">
          <table className="w-full text-sm">
            <thead className="bg-teal-50 text-left text-[11px] uppercase text-text-600">
              <tr>
                <th className="px-4 py-2.5">Type</th>
                <th className="px-4 py-2.5">Name</th>
                <th className="px-4 py-2.5">Phone</th>
                <th className="px-4 py-2.5">City</th>
                <th className="px-4 py-2.5">Bank</th>
                <th className="px-4 py-2.5">Category</th>
                <th className="px-4 py-2.5">Amount</th>
                <th className="px-4 py-2.5">Date</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((l) => (
                <tr key={l.id} className="border-t border-line">
                  <td className="px-4 py-2.5">
                    <Badge tone={l.type === 'full' ? 'teal' : 'grey'}>{l.type === 'full' ? 'Full' : 'Callback'}</Badge>
                  </td>
                  <td className="px-4 py-2.5 font-semibold text-text-900">{l.name}</td>
                  <td className="px-4 py-2.5 font-mono">{l.phone}</td>
                  <td className="px-4 py-2.5 text-text-600">{l.city ?? '—'}</td>
                  <td className="px-4 py-2.5 text-text-600">{l.bankName ?? '—'}</td>
                  <td className="px-4 py-2.5 text-text-600">{l.loanCategory}</td>
                  <td className="px-4 py-2.5 font-mono">{l.requestedAmount ? fmtLkr(l.requestedAmount) : '—'}</td>
                  <td className="px-4 py-2.5 text-text-400">{new Date(l.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
