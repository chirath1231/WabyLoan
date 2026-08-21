import { z } from 'zod';

export const sectorSchema = z.enum(['government', 'semi_government', 'private', 'self_employed']);
export const loanCategorySchema = z.enum(['personal', 'professional', 'housing', 'vehicle', 'business']);

export const eligibilityInputSchema = z.object({
  applicant: z.object({
    loanCategory: loanCategorySchema,
    sector: sectorSchema,
    occupationId: z.string().min(1),
    age: z.number().int().min(18).max(70),
    retirementAge: z.number().int().min(18).max(75),
    jointApplicant: z.boolean(),
    coApplicantIncome: z.number().min(0),
  }),
  income: z.object({
    grossMonthlyIncome: z.number().min(0),
    deductionsTotal: z.number().min(0),
  }),
  categoryDetails: z.object({
    vehicle: z
      .object({
        valuationLkr: z.number().min(0),
        manufactureYear: z.number().int(),
        downPaymentPct: z.number().min(10).max(50),
        balloonPayment: z.boolean(),
      })
      .optional(),
    housing: z
      .object({
        propertyValueLkr: z.number().min(0),
        repaymentDurationYears: z.number().int().min(5).max(30),
        downPaymentPct: z.number().min(10).max(50),
        legalFeePct: z.number().min(0),
        legalFeeCap: z.number().min(0),
      })
      .optional(),
    business: z
      .object({
        avgMonthlyRevenue: z.number().min(0),
        avgMonthlyExpenses: z.number().min(0),
      })
      .optional(),
  }),
  obligations: z.object({
    existingMonthlyObligations: z.number().min(0),
    settleWithNewLoan: z.boolean(),
    outstandingBalanceToSettle: z.number().min(0),
  }),
  requestedTermYears: z.number().min(0).max(30),
});
