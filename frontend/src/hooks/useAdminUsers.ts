'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/apiClient';

export interface AdminUser {
  id: string;
  email: string | null;
  name: string | null;
  role: 'user' | 'admin';
  active: boolean;
  authProvider: string;
  createdAt: string;
}

export function useAdminUsers() {
  return useQuery<AdminUser[]>({ queryKey: ['admin', 'users'], queryFn: () => api.get('/admin/users') });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Pick<AdminUser, 'role' | 'active'>> }) => api.put<AdminUser>(`/admin/users/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });
}
