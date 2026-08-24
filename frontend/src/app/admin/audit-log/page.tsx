'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/apiClient';

interface AuditRow {
  id: string;
  entityType: string;
  entityId: string;
  field: string;
  oldValue: string | null;
  newValue: string | null;
  changedAt: string;
  adminUser: { name: string | null; email: string | null };
}

export default function AdminAuditLogPage() {
  const { data: entries = [], isLoading } = useQuery<AuditRow[]>({ queryKey: ['admin', 'audit-log'], queryFn: () => api.get('/admin/audit-log') });

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-bold text-text-900">Audit Log</h1>
      {isLoading ? (
        <p className="text-sm text-text-600">Loading…</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-line bg-card">
          <table className="w-full text-sm">
            <thead className="bg-teal-50 text-left text-[11px] uppercase text-text-600">
              <tr>
                <th className="px-4 py-2.5">When</th>
                <th className="px-4 py-2.5">Admin</th>
                <th className="px-4 py-2.5">Entity</th>
                <th className="px-4 py-2.5">Field</th>
                <th className="px-4 py-2.5">Old → New</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id} className="border-t border-line">
                  <td className="whitespace-nowrap px-4 py-2.5 text-text-400">{new Date(e.changedAt).toLocaleString()}</td>
                  <td className="px-4 py-2.5">{e.adminUser?.name ?? e.adminUser?.email ?? '—'}</td>
                  <td className="px-4 py-2.5 text-text-600">
                    {e.entityType} <span className="text-text-400">({e.entityId.slice(0, 8)})</span>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-[12.5px]">{e.field}</td>
                  <td className="max-w-md truncate px-4 py-2.5 font-mono text-[12.5px] text-text-600">
                    {e.oldValue ?? '∅'} → {e.newValue ?? '∅'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
