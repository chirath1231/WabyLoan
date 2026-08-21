'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/apiClient';

export interface AdminSettings {
  dtiGovernment: number;
  dtiSemiGovernment: number;
  dtiPrivate: number;
  dtiSelfEmployed: number;
  specialOccupationDiscount: string | number;
  specialOccupationEnabled: boolean;
  professionalSchemeDiscount: string | number;
  professionalSchemeEnabled: boolean;
  loanRoundingStep: number;
  businessLoanEnabled: boolean;
}

export function useAdminSettings() {
  return useQuery<AdminSettings>({ queryKey: ['admin', 'settings'], queryFn: () => api.get('/admin/settings') });
}

export function useUpdateAdminSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<AdminSettings>) => api.put('/admin/settings', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'settings'] }),
  });
}

export function useResetToDefaults() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post('/admin/settings/reset-defaults'),
    onSuccess: () => qc.invalidateQueries(),
  });
}
