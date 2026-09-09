import { z } from 'zod';
import { sectorSchema } from './eligibility.js';

const targetOccupationSchema = z.enum(['all', 'doctor', 'engineer', 'gov_exec']).nullable();

export const bankWriteSchema = z.object({
  name: z.string().min(1),
  shortName: z.string().min(1),
  type: z.enum(['bank', 'finance']),
  active: z.boolean(),
  sponsored: z.boolean(),
  baseRate: z.number().min(1).max(50),
  docChargePct: z.number().min(0.5).max(1),
  docChargeMin: z.number().int().min(0),
  docChargeCap: z.number().int().min(0),
  maxTermPersonal: z.number().int().min(0).max(30),
  maxTermProfessional: z.number().int().min(0).max(30),
  maxTermHousing: z.number().int().min(0).max(30),
  maxTermVehicle: z.number().int().min(0).max(30),
  maxTermBusiness: z.number().int().min(0).max(30),
  specialRate: z.number().min(1).max(50).nullable().optional(),
  specialDocChargePct: z.number().min(0).max(5).nullable().optional(),
  specialMaxTermYears: z.number().int().min(0).max(30).nullable().optional(),
  allowedSectors: z.array(sectorSchema).min(1, 'At least one sector must remain checked.'),
  targetOccupation: targetOccupationSchema.optional(),
  remarks: z.array(z.string()),
  specialSchemeRemarks: z.array(z.string()),
  color: z.string().nullable().optional(),
  updatedDate: z.string(), // ISO date
});

export const bankUpdateSchema = bankWriteSchema.partial();

export const loanProductWriteSchema = z.object({
  bankId: z.string().min(1),
  name: z.string().min(1),
  category: z.enum(['personal', 'housing', 'vehicle_leasing', 'education', 'business', 'pensioner']),
  active: z.boolean(),

  repaymentCapacityBasePct: z.number().min(0).max(100),
  otIncomeIncluded: z.boolean(),
  otAveragingPeriodMonths: z.number().int().min(0).nullable().optional(),
  otherIncomeConsidered: z.boolean(),
  otherIncomeTypesAllowed: z.array(z.string()),

  loanTenureMinMonths: z.number().int().min(0),
  loanTenureMaxMonths: z.number().int().min(0),
  loanAmountMin: z.number().int().min(0),
  loanAmountMax: z.number().int().min(0),
  repaymentPeriodMinMonths: z.number().int().min(0),
  repaymentPeriodMaxMonths: z.number().int().min(0),

  docChargeBasis: z.enum(['pct_of_loan', 'fixed_amount']),
  docChargeValue: z.number().min(0),
  docChargeMin: z.number().int().min(0),
  docChargeMax: z.number().int().min(0),

  eligibleSectors: z.array(z.string()),
  eligibleCompaniesListRequired: z.boolean(),
  eligibleCompaniesReference: z.string().nullable().optional(),
  commonLoanOpenToAll: z.boolean(),
  genderEligibility: z.enum(['any', 'male_only', 'female_only']),
  ageMin: z.number().int().min(0).max(100),
  ageMaxAtMaturity: z.number().int().min(0).max(100),

  earlySettlementAllowed: z.boolean(),
  earlySettlementChargePct: z.number().min(0).max(100).nullable().optional(),
  balloonPaymentAllowed: z.boolean().nullable().optional(),
  balloonPaymentPct: z.number().min(0).max(100).nullable().optional(),

  interestRateType: z.enum(['fixed', 'variable', 'reducing_balance', 'flat']),
  interestRatePct: z.number().min(0).max(100),
  minEmploymentPeriodMonths: z.number().int().min(0),
  minNetMonthlyIncome: z.number().int().min(0),

  guarantorCount: z.number().int().min(0).max(2),
  collateralType: z.enum(['none', 'vehicle', 'property', 'fixed_deposit']),
  insuranceType: z.enum(['none', 'life', 'asset', 'both']),

  latePaymentPenaltyPct: z.number().min(0).max(100),
  gracePeriodDays: z.number().int().min(0),
  processingTimeDays: z.number().int().min(0),
  cribCheckRequired: z.boolean(),
  salaryCreditedToBank: z.boolean(),
  coApplicantAllowed: z.boolean(),
  topUpLoanAllowedAfterMonths: z.number().int().min(0).nullable().optional(),
  currency: z.string().min(1),
});

export const loanProductUpdateSchema = loanProductWriteSchema.partial();

export const occupationWriteSchema = z.object({
  slug: z.string().min(1),
  label: z.string().min(1),
  isSpecialSchemeEligible: z.boolean(),
});

export const occupationUpdateSchema = occupationWriteSchema.partial();

export const userUpdateSchema = z.object({
  role: z.enum(['user', 'admin']).optional(),
  active: z.boolean().optional(),
});

export const settingsUpdateSchema = z.object({
  dtiGovernment: z.number().int().min(10).max(90).optional(),
  dtiSemiGovernment: z.number().int().min(10).max(90).optional(),
  dtiPrivate: z.number().int().min(10).max(90).optional(),
  dtiSelfEmployed: z.number().int().min(10).max(90).optional(),
  specialOccupationDiscount: z.number().min(0).max(10).optional(),
  specialOccupationEnabled: z.boolean().optional(),
  professionalSchemeDiscount: z.number().min(0).max(10).optional(),
  professionalSchemeEnabled: z.boolean().optional(),
  loanRoundingStep: z.number().int().min(0).optional(),
  businessLoanEnabled: z.boolean().optional(),
});
