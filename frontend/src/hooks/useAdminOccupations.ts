'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/apiClient';

export interface AdminOccupation {
  id: string;
  slug: string;
  label: string;
  isSpecialSchemeEligible: boolean;
}

export function useAdminOccupations() {
  return useQuery<AdminOccupation[]>({ queryKey: ['admin', 'occupations'], queryFn: () => api.get('/admin/occupations') });
}

export function useCreateOccupation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { slug: string; label: string; isSpecialSchemeEligible: boolean }) => api.post('/admin/occupations', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'occupations'] }),
  });
}

export function useUpdateOccupation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AdminOccupation> }) => api.put(`/admin/occupations/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'occupations'] }),
  });
}
