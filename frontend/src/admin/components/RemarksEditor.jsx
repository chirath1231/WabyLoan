import { useState } from 'react';

// Ordered list of short remark lines (bank_remarks / product_remarks).
export default function RemarksEditor({ remarks, onChange }) {
  const [draft, setDraft] = useState('');
  const list = remarks || [];

  const add = () => {
    if (!draft.trim()) return;
    onChange([...list, draft.trim()]);
    setDraft('');
  };

  return (
    <div>
      <ul className="mb-2 space-y-1">
        {list.map((r, i) => (
          <li key={i} className="flex items-center justify-between text-sm admin-card px-3 py-2">
            <span>{r}</span>
            <button onClick={() => onChange(list.filter((_, idx) => idx !== i))} className="text-xs" style={{ color: 'var(--color-adm-danger)' }}>Remove</button>
          </li>
        ))}
      </ul>
      <div className="flex gap-2">
        <input
          className="admin-input" placeholder="Add a remark" value={draft}
          onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()}
        />
        <button onClick={add} className="admin-btn-ghost px-4">Add</button>
      </div>
    </div>
  );
}
