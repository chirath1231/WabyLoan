import { useEffect, useState } from 'react';
import BankDrawer from './BankDrawer.jsx';
import { api } from '../api/client.js';

export default function AdminBanksPage() {
  const [banks, setBanks] = useState([]);
  const [companyLists, setCompanyLists] = useState([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [drawer, setDrawer] = useState(null); // { bank } | { isNew: true } | null
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const [banksRes, listsRes] = await Promise.all([api.get('/admin/banks'), api.get('/admin/company-lists')]);
    setBanks(banksRes.data.banks);
    setCompanyLists(listsRes.data.companyLists);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = banks.filter((b) => {
    if (typeFilter !== 'all' && b.type !== typeFilter) return false;
    if (search && !b.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const deleteBank = async (bank) => {
    if (!confirm(`Delete "${bank.name}" and all its products? This cannot be undone.`)) return;
    await api.delete(`/admin/banks/${bank.id}`);
    load();
  };

  if (loading) return <p style={{ color: 'var(--color-adm-text-dim)' }}>Loading…</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="font-display font-bold text-xl">Banks</h1>
        <button onClick={() => setDrawer({ isNew: true })} className="admin-btn-primary px-4 py-2">+ Add a new bank</button>
      </div>

      <div className="flex gap-3 mb-4">
        <input className="admin-input max-w-xs" placeholder="Search banks…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="admin-select max-w-[160px]" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="all">All types</option>
          <option value="bank">Bank</option>
          <option value="finance">Finance company</option>
        </select>
      </div>

      <div className="admin-card overflow-x-auto">
        <table className="w-full admin-table">
          <thead>
            <tr>
              <th>Name</th><th>Type</th><th>Base Rate</th><th>Products</th><th>Status</th><th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((b) => (
              <tr key={b.id}>
                <td className="font-semibold">{b.name}</td>
                <td className="capitalize">{b.type}</td>
                <td className="font-mono">{b.baseRate}%</td>
                <td>{b.products.length}</td>
                <td>
                  <span className={`admin-badge ${b.active ? 'admin-badge-active' : 'admin-badge-inactive'}`}>{b.active ? 'Active' : 'Inactive'}</span>
                  {b.sponsored && <span className="admin-badge admin-badge-sponsored ml-1">Sponsored</span>}
                </td>
                <td className="text-right whitespace-nowrap">
                  <button onClick={() => setDrawer({ bank: b })} className="admin-btn-ghost px-3 py-1.5 text-xs mr-2">Edit</button>
                  <button onClick={() => deleteBank(b)} className="admin-btn-ghost px-3 py-1.5 text-xs" style={{ color: 'var(--color-adm-danger)' }}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {drawer && (
        <BankDrawer
          bank={drawer.bank || null}
          companyLists={companyLists}
          onClose={() => setDrawer(null)}
          onSaved={() => { setDrawer(null); load(); }}
        />
      )}
    </div>
  );
}
