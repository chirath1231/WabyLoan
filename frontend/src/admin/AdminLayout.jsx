import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const TABS = [
  { to: '/admin', label: 'Dashboard', icon: 'fa-gauge', end: true },
  { to: '/admin/banks', label: 'Banks', icon: 'fa-building-columns' },
  { to: '/admin/products', label: 'Loan Products', icon: 'fa-file-invoice-dollar' },
  { to: '/admin/occupations', label: 'Occupations', icon: 'fa-user-tie' },
  { to: '/admin/company-lists', label: 'Company Lists', icon: 'fa-list-check' },
  { to: '/admin/settings', label: 'Settings', icon: 'fa-sliders' },
  { to: '/admin/leads', label: 'Leads', icon: 'fa-bullhorn' },
  { to: '/admin/users', label: 'Users', icon: 'fa-users' },
  { to: '/admin/audit-log', label: 'Audit Log', icon: 'fa-clock-rotate-left' },
];

export default function AdminLayout() {
  const { isAdmin, user, openAuthPanel } = useAuth();

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <h1 className="font-display font-bold text-xl mb-2">Admin access required</h1>
        <p className="mb-4" style={{ color: 'var(--color-text-600)' }}>
          {user ? "Your account doesn't have admin access." : 'Sign in with an admin account to continue.'}
        </p>
        {!user && (
          <button onClick={() => openAuthPanel('login')} className="btn-primary rounded-lg h-11 px-6">Sign in</button>
        )}
      </div>
    );
  }

  return (
    <div className="admin-shell flex">
      <aside className="w-56 flex-shrink-0 p-4 border-r hidden md:block" style={{ borderColor: 'var(--color-adm-border)' }}>
        <nav className="flex flex-col gap-1">
          {TABS.map((tab) => (
            <NavLink
              key={tab.to} to={tab.to} end={tab.end}
              className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}
            >
              <i className={`fa-solid ${tab.icon} w-4`} /> {tab.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-6 min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
