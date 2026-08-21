'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/apiClient';

export interface AdminBank {
  id: string;
  name: string;
  shortName: string;
  type: 'bank' | 'finance';
  active: boolean;
  sponsored: boolean;
  baseRate: string | number;
  docChargePct: string | number;
  docChargeMin: number;
  docChargeCap: number;
  maxTermPersonal: number;
  maxTermProfessional: number;
  maxTermHousing: number;
  maxTermVehicle: number;
  maxTermBusiness: number;
  specialRate: string | number | null;
  specialDocChargePct: string | number | null;
  specialMaxTermYears: number | null;
  allowedSectors: string[];
  targetOccupation: string | null;
  remarks: string[];
  specialSchemeRemarks: string[];
  color: string | null;
  updatedDate: string;
}

export function useAdminBanks() {
  return useQuery<AdminBank[]>({ queryKey: ['admin', 'banks'], queryFn: () => api.get('/admin/banks') });
}

export function useCreateBank() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<AdminBank>) => api.post<AdminBank>('/admin/banks', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'banks'] }),
  });
}

export function useUpdateBank() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AdminBank> }) => api.put<AdminBank>(`/admin/banks/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'banks'] }),
  });
}
