import { useEffect, useState } from 'react';
import { api } from '../api/client.js';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => api.get('/admin/users').then(({ data }) => { setUsers(data.users); setLoading(false); });
  useEffect(() => { load(); }, []);

  const toggleRole = async (user) => {
    const nextRole = user.role === 'admin' ? 'user' : 'admin';
    try {
      await api.put(`/admin/users/${user.id}/role`, { role: nextRole });
      load();
    } catch (err) {
      alert(err?.response?.data?.error || 'Could not update role.');
    }
  };

  if (loading) return <p style={{ color: 'var(--color-adm-text-dim)' }}>Loading…</p>;

  return (
    <div>
      <h1 className="font-display font-bold text-xl mb-5">Users</h1>
      <div className="admin-card overflow-x-auto">
        <table className="w-full admin-table">
          <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Joined</th><th></th></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td className="font-semibold">{u.name}</td>
                <td>{u.email}</td>
                <td><span className={`admin-badge ${u.role === 'admin' ? 'admin-badge-admin' : 'admin-badge-user'}`}>{u.role}</span></td>
                <td className="hint">{new Date(u.created_at).toLocaleDateString()}</td>
                <td className="text-right">
                  <button onClick={() => toggleRole(u)} className="admin-btn-ghost px-3 py-1.5 text-xs">
                    Make {u.role === 'admin' ? 'User' : 'Admin'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
