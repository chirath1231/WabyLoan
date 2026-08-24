import React, { createContext, useContext, useMemo, useState, useCallback } from 'react';

export const DEFAULT_RETIREMENT = {
  government: 60,
  semi_government: 60,
  private: 60,
  self_employed: 65,
};

const initialState = {
  loanCategory: null,
  sector: null,
  occupationId: null,
  age: null,
  retirementAge: null,
  retirementAgeCustom: false,
  jointApplicant: false,
  coApplicantIncome: 0,

  grossMonthlyIncome: 0,
  deductionsTotal: 0,
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
};

const WizardContext = createContext(null);

export function WizardProvider({ children }) {
  const [state, setState] = useState(initialState);

  const setField = useCallback((key, value) => {
    setState((prev) => ({ ...prev, [key]: value }));
  }, []);

  const setFields = useCallback((patch) => {
    setState((prev) => ({ ...prev, ...patch }));
  }, []);

  const reset = useCallback(() => setState(initialState), []);

  const value = useMemo(() => ({ state, setField, setFields, reset }), [state, setField, setFields, reset]);

  return <WizardContext.Provider value={value}>{children}</WizardContext.Provider>;
}

export function useWizard() {
  const ctx = useContext(WizardContext);
  if (!ctx) throw new Error('useWizard must be used within WizardProvider');
  return ctx;
}

/** Builds the exact payload backend's eligibilityInputSchema expects. */
export function buildEligibilityInput(state) {
  const income =
    state.loanCategory === 'business'
      ? { grossMonthlyIncome: state.businessRevenue, deductionsTotal: 0 }
      : state.sector === 'self_employed'
        ? { grossMonthlyIncome: state.grossMonthlyIncome, deductionsTotal: 0 }
        : { grossMonthlyIncome: state.grossMonthlyIncome, deductionsTotal: state.deductionsTotal };

  const requestedTermYears =
    state.loanCategory === 'business'
      ? state.businessTermYears
      : state.loanCategory === 'housing'
        ? state.housingTerm
        : state.requestedTermYears;

  return {
    applicant: {
      loanCategory: state.loanCategory,
      sector: state.sector,
      occupationId: state.occupationId,
      age: state.age,
      retirementAge: state.retirementAge,
      jointApplicant: state.jointApplicant,
      coApplicantIncome: state.jointApplicant ? state.coApplicantIncome : 0,
    },
    income,
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
      outstandingBalanceToSettle: state.settleWithNewLoan ? state.outstandingBalanceToSettle : 0,
    },
    requestedTermYears,
  };
}
