import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';

const CARDS = [
  { key: 'bankCount', label: 'Banks', icon: 'fa-building-columns', to: '/admin/banks' },
  { key: 'productCount', label: 'Loan Products', icon: 'fa-file-invoice-dollar', to: '/admin/products' },
  { key: 'companyListCount', label: 'Company Lists', icon: 'fa-list-check', to: '/admin/company-lists' },
  { key: 'leadCount', label: 'Leads', icon: 'fa-bullhorn', to: '/admin/leads' },
  { key: 'userCount', label: 'Users', icon: 'fa-users', to: '/admin/users' },
  { key: 'auditLogCount', label: 'Audit Log Entries', icon: 'fa-clock-rotate-left', to: '/admin/audit-log' },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/admin/dashboard').then(({ data }) => setStats(data));
  }, []);

  return (
    <div>
      <h1 className="font-display font-bold text-xl mb-6">Dashboard</h1>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {CARDS.map((c) => (
          <button key={c.key} onClick={() => navigate(c.to)} className="admin-dashboard-card text-left">
            <i className={`fa-solid ${c.icon} text-lg mb-2`} style={{ color: 'var(--color-adm-accent)' }} />
            <div className="text-2xl font-bold font-mono">{stats ? stats[c.key] : '…'}</div>
            <div className="text-sm" style={{ color: 'var(--color-adm-text-dim)' }}>{c.label}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
