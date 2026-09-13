import { useEffect, useState } from 'react';
import CompanyListDrawer from './CompanyListDrawer.jsx';
import { api } from '../api/client.js';

export default function AdminCompanyListsPage() {
  const [lists, setLists] = useState([]);
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawer, setDrawer] = useState(null);

  const load = async () => {
    const [listsRes, banksRes] = await Promise.all([api.get('/admin/company-lists'), api.get('/admin/banks')]);
    setLists(listsRes.data.companyLists);
    setBanks(banksRes.data.banks);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const remove = async (list) => {
    if (!confirm(`Delete "${list.name}"?`)) return;
    await api.delete(`/admin/company-lists/${list.id}`);
    load();
  };

  const bankName = (id) => banks.find((b) => b.id === id)?.name || id;

  if (loading) return <p style={{ color: 'var(--color-adm-text-dim)' }}>Loading…</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="font-display font-bold text-xl">Company Lists</h1>
        <button onClick={() => setDrawer({ isNew: true })} className="admin-btn-primary px-4 py-2">+ Add List</button>
      </div>

      <div className="admin-card overflow-x-auto">
        <table className="w-full admin-table">
          <thead><tr><th>List</th><th>Bank</th><th>Entries</th><th></th></tr></thead>
          <tbody>
            {lists.map((l) => (
              <tr key={l.id}>
                <td className="font-semibold">{l.name}</td>
                <td>{bankName(l.bankId)}</td>
                <td>{l.entries.length}</td>
                <td className="text-right whitespace-nowrap">
                  <button onClick={() => setDrawer({ list: l })} className="admin-btn-ghost px-3 py-1.5 text-xs mr-2">Edit</button>
                  <button onClick={() => remove(l)} className="admin-btn-ghost px-3 py-1.5 text-xs" style={{ color: 'var(--color-adm-danger)' }}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {drawer && (
        <CompanyListDrawer
          list={drawer.list || null} banks={banks}
          onClose={() => setDrawer(null)} onSaved={() => { setDrawer(null); load(); }}
        />
      )}
    </div>
  );
}
