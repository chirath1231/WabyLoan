import type { EligibilityInput } from '@wabyloan/engine';
import type { WizardState } from '@/store/wizardStore';
import { deriveIncomeProfile } from './deriveIncome';

export function buildEligibilityInput(state: WizardState): EligibilityInput {
  return {
    applicant: {
      loanCategory: state.loanCategory!,
      sector: state.sector!,
      occupationId: state.occupationId!,
      age: state.age!,
      retirementAge: state.retirementAge!,
      jointApplicant: state.jointApplicant,
      coApplicantIncome: state.coApplicantIncome,
    },
    income: deriveIncomeProfile(state),
    categoryDetails: {
      vehicle:
        state.loanCategory === 'vehicle'
          ? {
              valuationLkr: state.vehicleValuation,
              manufactureYear: state.vehicleYear,
              downPaymentPct: state.vehicleDownPaymentPct,
              balloonPayment: state.vehicleBalloon,
            }
          : undefined,
      housing:
        state.loanCategory === 'housing'
          ? {
              propertyValueLkr: state.housingPropertyValue,
              repaymentDurationYears: state.housingTerm,
              downPaymentPct: state.housingDownPaymentPct,
              legalFeePct: 0.3,
              legalFeeCap: 100000,
            }
          : undefined,
      business:
        state.loanCategory === 'business'
          ? { avgMonthlyRevenue: state.businessRevenue, avgMonthlyExpenses: state.businessExpenses }
          : undefined,
    },
    obligations: {
      existingMonthlyObligations: state.existingObligations,
      settleWithNewLoan: state.settleWithNewLoan,
      outstandingBalanceToSettle: state.outstandingBalanceToSettle,
    },
    requestedTermYears:
      state.loanCategory === 'business'
        ? state.businessTermYears
        : state.loanCategory === 'housing'
          ? state.housingTerm
          : state.requestedTermYears,
  };
}
