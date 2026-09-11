import { create } from 'zustand';
import type { EngineRunResult, LoanCategory, Sector } from '@wabyloan/engine';

export interface IncomeItemState {
  id: string;
  label: string;
  type: 'earning' | 'deduction';
  fixed: boolean;
  amount: number;
  checked: boolean;
  locked?: boolean;
}

export interface WizardState {
  step: number;
  canGoNext: boolean;
  loanCategory: LoanCategory | null;
  sector: Sector | null;
  occupationId: string | null;
  customOccupation: string;

  age: number | null;
  retirementAge: number | null;
  retirementAgeCustom: boolean;
  jointApplicant: boolean;
  coApplicantIncome: number;
  gender: 'male' | 'female' | null;
  employerName: string;
  employmentMonths: number | null;

  incomeMode: 'ocr' | 'manual';
  ocrItems: IncomeItemState[];
  ocrEmployee: { name: string; employer: string; designation: string; payPeriod: string } | null;
  manualBasic: number;
  manualAllowances: number;
  manualDeductions: number;
  manualItemized: boolean;
  manualAllowanceItems: IncomeItemState[];
  manualDeductionItems: IncomeItemState[];
  epfManuallyEdited: boolean;
  selfEmployedIncome: number;
  businessRevenue: number;
  businessExpenses: number;

  vehicleValuation: number;
  vehicleYear: number;
  vehicleDownPaymentPct: number;
  vehicleBalloon: boolean;
  housingPropertyValue: number;
  housingTerm: number;
  housingDownPaymentPct: number;
  businessTermYears: number;
  requestedTermYears: number;

  existingObligations: number;
  settleWithNewLoan: boolean;
  outstandingBalanceToSettle: number;

  engineResult: EngineRunResult | null;
  restricted: boolean;
  applicationId: string | null;
  selectedVariantKey: string | null;
  compareSelection: string[];

  setStep: (step: number) => void;
  setField: <K extends keyof WizardState>(key: K, value: WizardState[K]) => void;
  reset: () => void;
}

const initialState = {
  step: 1,
  canGoNext: true,
  loanCategory: null,
  sector: null,
  occupationId: null,
  customOccupation: '',

  age: null,
  retirementAge: null,
  retirementAgeCustom: false,
  jointApplicant: false,
  coApplicantIncome: 0,
  gender: null,
  employerName: '',
  employmentMonths: null,

  incomeMode: 'manual' as const,
  ocrItems: [],
  ocrEmployee: null,
  manualBasic: 0,
  manualAllowances: 0,
  manualDeductions: 0,
  manualItemized: false,
  manualAllowanceItems: [],
  manualDeductionItems: [],
  epfManuallyEdited: false,
  selfEmployedIncome: 0,
  businessRevenue: 0,
  businessExpenses: 0,

  vehicleValuation: 0,
  vehicleYear: new Date().getFullYear(),
  vehicleDownPaymentPct: 20,
  vehicleBalloon: false,
  housingPropertyValue: 0,
  housingTerm: 20,
  housingDownPaymentPct: 20,
  businessTermYears: 3,
  requestedTermYears: 5,

  existingObligations: 0,
  settleWithNewLoan: false,
  outstandingBalanceToSettle: 0,

  engineResult: null,
  restricted: false,
  applicationId: null,
  selectedVariantKey: null,
  compareSelection: [],
};

export const useWizardStore = create<WizardState>((set) => ({
  ...initialState,
  setStep: (step) => set({ step }),
  setField: (key, value) => set({ [key]: value } as Partial<WizardState>),
  reset: () => set(initialState),
}));
