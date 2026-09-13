import { useState } from 'react';
import Drawer from './components/Drawer.jsx';
import { TextField, SelectField } from './components/Field.jsx';
import { api } from '../api/client.js';

export default function CompanyListDrawer({ list, banks, onClose, onSaved }) {
  const isNew = !list;
  const [bankId, setBankId] = useState(list?.bankId || banks[0]?.id || '');
  const [name, setName] = useState(list?.name || '');
  const [entries, setEntries] = useState(list?.entries || []);
  const [draft, setDraft] = useState({ name: '', tier: 'B', sector: '' });
  const [saving, setSaving] = useState(false);

  const addEntry = () => {
    if (!draft.name.trim()) return;
    setEntries([...entries, draft]);
    setDraft({ name: '', tier: 'B', sector: '' });
  };
  const removeEntry = (i) => setEntries(entries.filter((_, idx) => idx !== i));

  const save = async () => {
    setSaving(true);
    try {
      if (isNew) {
        const id = `${bankId}_${name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`;
        await api.post('/admin/company-lists', { id, bankId, name, entries });
      } else {
        await api.put(`/admin/company-lists/${list.id}`, { name, entries });
      }
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer title={isNew ? 'Add Company List' : `Edit: ${list.name}`} onClose={onClose} onSave={save} saving={saving}>
      {isNew && (
        <SelectField label="Bank" value={bankId} onChange={setBankId} options={banks.map((b) => ({ value: b.id, label: b.name }))} />
      )}
      <TextField label="List name" value={name} onChange={setName} placeholder="e.g. Approved Employer List" />

      <div className="border-t pt-4" style={{ borderColor: 'var(--color-adm-border)' }}>
        <h3 className="font-semibold text-sm mb-3">Entries ({entries.length})</h3>
        <ul className="space-y-2 mb-3">
          {entries.map((e, i) => (
            <li key={i} className="admin-card p-3 flex items-center justify-between text-sm">
              <div>
                <div className="font-semibold">{e.name}</div>
                <div className="hint">Tier {e.tier} · {e.sector}</div>
              </div>
              <button onClick={() => removeEntry(i)} className="text-xs" style={{ color: 'var(--color-adm-danger)' }}>Remove</button>
            </li>
          ))}
        </ul>
        <div className="grid grid-cols-3 gap-2">
          <input className="admin-input col-span-1" placeholder="Name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          <input className="admin-input" placeholder="Tier" value={draft.tier} onChange={(e) => setDraft({ ...draft, tier: e.target.value })} />
          <input className="admin-input" placeholder="Sector" value={draft.sector} onChange={(e) => setDraft({ ...draft, sector: e.target.value })} />
        </div>
        <button onClick={addEntry} className="admin-btn-ghost px-4 py-2 mt-2 text-sm">+ Add Entry</button>
      </div>
    </Drawer>
  );
}
