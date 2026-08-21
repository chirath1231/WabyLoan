export type Sector = 'government' | 'semi_government' | 'private' | 'self_employed';

export type LoanCategory = 'personal' | 'professional' | 'housing' | 'vehicle' | 'business';

export type BankType = 'bank' | 'finance';

/** Restricts a bank's Special Scheme variant only (see evaluateVariant gating). 'all'/null = unrestricted. */
export type TargetOccupation = 'all' | 'doctor' | 'engineer' | 'gov_exec' | null;

export interface MaxTermYears {
  personal: number;
  professional: number;
  housing: number;
  vehicle: number;
  business: number;
}

export interface Bank {
  id: string;
  name: string;
  shortName: string;
  type: BankType;
  active: boolean;
  sponsored: boolean;
  baseRate: number;
  maxTermYears: MaxTermYears;
  docChargePct: number;
  docChargeMin: number;
  docChargeCap: number;
  color?: string | null;
  /** Per-bank "rates effective" date (ISO 8601). Never a single global claim. */
  updatedDate: string;
  allowedSectors: Sector[];
  targetOccupation: TargetOccupation;
  remarks: string[];
  specialSchemeRemarks: string[];
  /** null = fall back to baseRate - professionalSchemeDiscount */
  specialRate: number | null;
  /** null = fall back to docChargePct */
  specialDocChargePct: number | null;
  /** null = fall back to maxTermYears.professional */
  specialMaxTermYears: number | null;
}

export interface Occupation {
  id: string;
  label: string;
  isSpecialSchemeEligible: boolean;
}

export interface EngineConfig {
  dtiBySector: Record<Sector, number>;
  /** Standard, smaller professional courtesy discount applied to the General Scheme variant. */
  specialOccupationDiscount: number;
  specialOccupationEnabled: boolean;
  /** Deeper discount used as the fallback rate for the dedicated Special Scheme variant. */
  professionalSchemeDiscount: number;
  professionalSchemeEnabled: boolean;
  /** 0 = exact, no rounding. */
  loanRoundingStep: number;
  businessLoanEnabled: boolean;
}

export interface ApplicantProfile {
  loanCategory: LoanCategory;
  sector: Sector;
  /** Occupation id, matched against Occupation[] / Bank.targetOccupation. */
  occupationId: string;
  age: number;
  retirementAge: number;
  jointApplicant: boolean;
  coApplicantIncome: number;
}

export interface IncomeProfile {
  /** Fully resolved monthly gross income (already includes any itemization the caller applied). */
  grossMonthlyIncome: number;
  /** Total of checked deduction line items (statutory + any others the user left checked). 0 for self-employed/business. */
  deductionsTotal: number;
}

export interface VehicleDetails {
  valuationLkr: number;
  manufactureYear: number;
  downPaymentPct: number;
  balloonPayment: boolean;
}

export interface HousingDetails {
  propertyValueLkr: number;
  repaymentDurationYears: number;
  downPaymentPct: number;
  legalFeePct: number;
  legalFeeCap: number;
}

export interface BusinessDetails {
  avgMonthlyRevenue: number;
  avgMonthlyExpenses: number;
}

export interface CategoryDetails {
  vehicle?: VehicleDetails;
  housing?: HousingDetails;
  business?: BusinessDetails;
}

export interface ObligationsInput {
  existingMonthlyObligations: number;
  settleWithNewLoan: boolean;
  outstandingBalanceToSettle: number;
}

export interface EligibilityInput {
  applicant: ApplicantProfile;
  income: IncomeProfile;
  categoryDetails: CategoryDetails;
  obligations: ObligationsInput;
  /** User's Step 4 term preference, in years. */
  requestedTermYears: number;
  /** Injectable for deterministic tests; defaults to the current year. */
  currentYear?: number;
}

export type TermCapReason = 'bank max' | 'age limit' | null;

export interface EligibilityResult {
  bankId: string;
  bankName: string;
  bankShortName: string;
  bankType: BankType;
  sponsored: boolean;
  color?: string | null;
  updatedDate: string;
  /** bank.id for single-variant results, or `${bank.id}__special` / `${bank.id}__general` in dual-scheme mode. */
  variantKey: string;
  variantLabel: string | null;
  schemeApplied: boolean;
  ineligible: boolean;
  ineligibleReason: string | null;
  rate?: number;
  termYears?: number;
  termCapReason?: TermCapReason;
  months?: number;
  maxLoan?: number;
  emi?: number;
  docCharge?: number;
  legalFee?: number;
  totalRepayment?: number;
  totalInterest?: number;
  /** Ranking metric: Total Interest + Doc Charge. Principal is deliberately excluded. */
  totalCostOfCredit?: number;
  /** Display-only literal all-in figure: Principal + Total Interest + Doc Charge. */
  totalOutlay?: number;
  emiPlus1?: number;
  emiPlus2?: number;
  netCashInHand?: number | null;
  cappedByAsset?: boolean;
  downPayment?: number;
  /** Guarantor/approval-condition lines for the active variant (SRS §4.3). Empty for ineligible results. */
  remarks: string[];
}

export interface EngineRunResult {
  /** Eligible results sorted by totalCostOfCredit ascending, followed by ineligible results. */
  results: EligibilityResult[];
  emiCapacity: number;
  dtiPctUsed: number;
  ageCapYears: number;
  professionalGate: boolean;
  dualSchemeMode: boolean;
}

export interface IncomeItem {
  id: string;
  type: 'earning' | 'deduction';
  fixed: boolean;
  amount: number;
  checked: boolean;
  locked?: boolean;
}
