'use client';

import { useAdminUsers, useUpdateUser } from '@/hooks/useAdminUsers';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { Switch } from '@/components/ui/Switch';

const ROLE_OPTIONS = [
  { value: 'user', label: 'User' },
  { value: 'admin', label: 'Admin' },
];

export default function AdminUsersPage() {
  const { data: users = [], isLoading } = useAdminUsers();
  const { user: me } = useAuth();
  const updateUser = useUpdateUser();

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-bold text-text-900">Users</h1>
      {isLoading ? (
        <p className="text-sm text-text-600">Loading…</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-line bg-card">
          <table className="w-full text-sm">
            <thead className="bg-teal-50 text-left text-[11px] uppercase text-text-600">
              <tr>
                <th className="px-4 py-2.5">Name</th>
                <th className="px-4 py-2.5">Email</th>
                <th className="px-4 py-2.5">Provider</th>
                <th className="px-4 py-2.5">Role</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isSelf = u.id === me?.id;
                return (
                  <tr key={u.id} className="border-t border-line">
                    <td className="px-4 py-2.5 font-semibold text-text-900">
                      {u.name ?? '—'}
                      {isSelf && <Badge tone="violet" className="ml-2">You</Badge>}
                    </td>
                    <td className="px-4 py-2.5 text-text-600">{u.email ?? '—'}</td>
                    <td className="px-4 py-2.5 capitalize text-text-600">{u.authProvider}</td>
                    <td className="px-4 py-2.5">
                      <div className="max-w-[140px]">
                        <Select
                          value={u.role}
                          options={ROLE_OPTIONS}
                          disabled={isSelf || updateUser.isPending}
                          onChange={(role) => updateUser.mutate({ id: u.id, data: { role: role as 'user' | 'admin' } })}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <Switch
                        checked={u.active}
                        disabled={isSelf || updateUser.isPending}
                        onCheckedChange={(active) => updateUser.mutate({ id: u.id, data: { active } })}
                        label={u.active ? 'Active' : 'Deactivated'}
                      />
                    </td>
                    <td className="px-4 py-2.5 text-text-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
