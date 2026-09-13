import { useEffect, useState } from 'react';
import { api } from '../api/client.js';

const STATUSES = ['new', 'contacted', 'approved', 'rejected', 'closed'];

export default function AdminLeadsPage() {
  const [tab, setTab] = useState('applications');
  const [softLeads, setSoftLeads] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const [softRes, appsRes] = await Promise.all([api.get('/admin/leads/soft'), api.get('/admin/leads/applications')]);
    setSoftLeads(softRes.data.softLeads);
    setApplications(appsRes.data.applications);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const updateStatus = async (app, status) => {
    await api.put(`/admin/leads/applications/${app.id}/status`, { status });
    load();
  };

  if (loading) return <p style={{ color: 'var(--color-adm-text-dim)' }}>Loading…</p>;

  return (
    <div>
      <h1 className="font-display font-bold text-xl mb-5">Leads</h1>

      <div className="flex gap-2 mb-4">
        <button onClick={() => setTab('applications')} className={`admin-btn-ghost px-4 py-2 text-sm ${tab === 'applications' ? 'admin-nav-link active' : ''}`}>
          Applications ({applications.length})
        </button>
        <button onClick={() => setTab('soft')} className={`admin-btn-ghost px-4 py-2 text-sm ${tab === 'soft' ? 'admin-nav-link active' : ''}`}>
          Callback Requests ({softLeads.length})
        </button>
      </div>

      {tab === 'applications' ? (
        <div className="admin-card overflow-x-auto">
          <table className="w-full admin-table">
            <thead><tr><th>User</th><th>Bank</th><th>Category</th><th>Requested</th><th>Status</th><th>Date</th></tr></thead>
            <tbody>
              {applications.map((a) => (
                <tr key={a.id}>
                  <td>{a.user_name}<div className="hint">{a.user_email}</div></td>
                  <td>{a.bank_name}</td>
                  <td className="capitalize">{a.category}</td>
                  <td className="font-mono">{a.requested_amount ? Number(a.requested_amount).toLocaleString('en-LK') : '—'}</td>
                  <td>
                    <select className="admin-select !w-auto text-xs" value={a.status} onChange={(e) => updateStatus(a, e.target.value)}>
                      {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="hint">{new Date(a.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
              {!applications.length && <tr><td colSpan={6} className="text-center hint py-6">No applications yet.</td></tr>}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="admin-card overflow-x-auto">
          <table className="w-full admin-table">
            <thead><tr><th>Name</th><th>Phone</th><th>Category</th><th>Bank</th><th>Date</th></tr></thead>
            <tbody>
              {softLeads.map((l) => (
                <tr key={l.id}>
                  <td className="font-semibold">{l.name}</td>
                  <td className="font-mono">{l.phone}</td>
                  <td className="capitalize">{l.category || '—'}</td>
                  <td>{l.bank_name || '—'}</td>
                  <td className="hint">{new Date(l.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
              {!softLeads.length && <tr><td colSpan={5} className="text-center hint py-6">No callback requests yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
