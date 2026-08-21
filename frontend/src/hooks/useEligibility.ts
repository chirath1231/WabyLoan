'use client';

import { useMutation } from '@tanstack/react-query';
import type { EligibilityInput, EngineRunResult } from '@wabyloan/engine';
import { api } from '@/lib/apiClient';

export interface EvaluateResponse {
  restricted: boolean;
  engineResult: EngineRunResult;
  applicationId: string | null;
}

export function useEvaluateEligibility() {
  return useMutation({
    mutationFn: (input: EligibilityInput) => api.post<EvaluateResponse>('/eligibility/evaluate', input),
  });
}
