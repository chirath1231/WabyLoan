import { useEffect, useState } from 'react';
import { api } from '../api/client.js';

export default function AdminOccupationsPage() {
  const [occupations, setOccupations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newId, setNewId] = useState('');
  const [newLabel, setNewLabel] = useState('');

  const load = () => api.get('/admin/occupations').then(({ data }) => { setOccupations(data.occupations); setLoading(false); });
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!newId.trim() || !newLabel.trim()) return;
    await api.post('/admin/occupations', { id: newId.trim().toLowerCase().replace(/\s+/g, '_'), label: newLabel.trim(), special: false });
    setNewId(''); setNewLabel('');
    load();
  };

  const toggleSpecial = async (occ) => {
    await api.put(`/admin/occupations/${occ.id}`, { special: !occ.special });
    load();
  };

  const remove = async (occ) => {
    if (!confirm(`Delete occupation "${occ.label}"?`)) return;
    await api.delete(`/admin/occupations/${occ.id}`);
    load();
  };

  if (loading) return <p style={{ color: 'var(--color-adm-text-dim)' }}>Loading…</p>;

  return (
    <div>
      <h1 className="font-display font-bold text-xl mb-5">Occupations</h1>
      <p className="hint mb-4">Occupations flagged "special" auto-qualify for the discounted Special Scheme on Personal Loans.</p>

      <div className="admin-card overflow-x-auto mb-5">
        <table className="w-full admin-table">
          <thead><tr><th>Label</th><th>ID</th><th>Special scheme</th><th></th></tr></thead>
          <tbody>
            {occupations.map((o) => (
              <tr key={o.id}>
                <td className="font-semibold">{o.label}</td>
                <td className="font-mono hint">{o.id}</td>
                <td>
                  <button onClick={() => toggleSpecial(o)} className={`admin-badge ${o.special ? 'admin-badge-active' : 'admin-badge-inactive'}`}>
                    {o.special ? 'Special ★' : 'Standard'}
                  </button>
                </td>
                <td className="text-right"><button onClick={() => remove(o)} className="admin-btn-ghost px-3 py-1.5 text-xs" style={{ color: 'var(--color-adm-danger)' }}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="admin-card p-4 flex flex-col sm:flex-row gap-3 items-end">
        <div className="flex-1">
          <label className="field-label">Label</label>
          <input className="admin-input" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="e.g. Pilot" />
        </div>
        <div className="flex-1">
          <label className="field-label">ID (slug)</label>
          <input className="admin-input" value={newId} onChange={(e) => setNewId(e.target.value)} placeholder="e.g. pilot" />
        </div>
        <button onClick={add} className="admin-btn-primary h-11 px-5">Add Occupation</button>
      </div>
    </div>
  );
}
