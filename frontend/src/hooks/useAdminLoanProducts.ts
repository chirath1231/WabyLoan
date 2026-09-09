'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/apiClient';

export type LoanProductCategory = 'personal' | 'housing' | 'vehicle_leasing' | 'education' | 'business' | 'pensioner';

export interface AdminLoanProduct {
  id: string;
  bankId: string;
  name: string;
  category: LoanProductCategory;
  active: boolean;

  repaymentCapacityBasePct: string | number;
  otIncomeIncluded: boolean;
  otAveragingPeriodMonths: number | null;
  otherIncomeConsidered: boolean;
  otherIncomeTypesAllowed: string[];

  loanTenureMinMonths: number;
  loanTenureMaxMonths: number;
  loanAmountMin: number;
  loanAmountMax: number;
  repaymentPeriodMinMonths: number;
  repaymentPeriodMaxMonths: number;

  docChargeBasis: 'pct_of_loan' | 'fixed_amount';
  docChargeValue: string | number;
  docChargeMin: number;
  docChargeMax: number;

  eligibleSectors: string[];
  eligibleCompaniesListRequired: boolean;
  eligibleCompaniesReference: string | null;
  commonLoanOpenToAll: boolean;
  genderEligibility: 'any' | 'male_only' | 'female_only';
  ageMin: number;
  ageMaxAtMaturity: number;

  earlySettlementAllowed: boolean;
  earlySettlementChargePct: string | number | null;
  balloonPaymentAllowed: boolean | null;
  balloonPaymentPct: string | number | null;

  interestRateType: 'fixed' | 'variable' | 'reducing_balance' | 'flat';
  interestRatePct: string | number;
  minEmploymentPeriodMonths: number;
  minNetMonthlyIncome: number;

  guarantorCount: number;
  collateralType: 'none' | 'vehicle' | 'property' | 'fixed_deposit';
  insuranceType: 'none' | 'life' | 'asset' | 'both';

  latePaymentPenaltyPct: string | number;
  gracePeriodDays: number;
  processingTimeDays: number;
  cribCheckRequired: boolean;
  salaryCreditedToBank: boolean;
  coApplicantAllowed: boolean;
  topUpLoanAllowedAfterMonths: number | null;
  currency: string;
}

export function useAdminLoanProducts(bankId?: string) {
  return useQuery<AdminLoanProduct[]>({
    queryKey: ['admin', 'loan-products', bankId ?? 'all'],
    queryFn: () => api.get(bankId ? `/admin/loan-products?bankId=${bankId}` : '/admin/loan-products'),
  });
}

export function useCreateLoanProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<AdminLoanProduct>) => api.post<AdminLoanProduct>('/admin/loan-products', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'loan-products'] }),
  });
}

export function useUpdateLoanProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AdminLoanProduct> }) =>
      api.put<AdminLoanProduct>(`/admin/loan-products/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'loan-products'] }),
  });
}
