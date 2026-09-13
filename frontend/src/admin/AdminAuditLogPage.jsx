import { useEffect, useState } from 'react';
import { api } from '../api/client.js';

export default function AdminAuditLogPage() {
  const [log, setLog] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/audit-log').then(({ data }) => { setLog(data.auditLog); setLoading(false); });
  }, []);

  if (loading) return <p style={{ color: 'var(--color-adm-text-dim)' }}>Loading…</p>;

  return (
    <div>
      <h1 className="font-display font-bold text-xl mb-5">Audit Log</h1>
      <div className="admin-card overflow-x-auto">
        <table className="w-full admin-table">
          <thead><tr><th>Actor</th><th>Action</th><th>Details</th><th>When</th></tr></thead>
          <tbody>
            {log.map((entry) => (
              <tr key={entry.id}>
                <td className="font-semibold">{entry.actor_email}</td>
                <td className="font-mono text-xs">{entry.action}</td>
                <td className="hint max-w-md truncate">{JSON.stringify(entry.details)}</td>
                <td className="hint whitespace-nowrap">{new Date(entry.created_at).toLocaleString()}</td>
              </tr>
            ))}
            {!log.length && <tr><td colSpan={4} className="text-center hint py-6">No admin actions logged yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
