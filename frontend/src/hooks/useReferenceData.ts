'use client';

import { useQuery } from '@tanstack/react-query';
import type { Occupation } from '@wabyloan/engine';
import { api } from '@/lib/apiClient';

export interface PublicSettings {
  businessLoanEnabled: boolean;
  professionalSchemeEnabled: boolean;
  loanRoundingStep: number;
}

export function useOccupations() {
  return useQuery<Occupation[]>({ queryKey: ['occupations'], queryFn: () => api.get('/occupations') });
}

export function usePublicSettings() {
  return useQuery<PublicSettings>({ queryKey: ['settings', 'public'], queryFn: () => api.get('/settings/public') });
}
