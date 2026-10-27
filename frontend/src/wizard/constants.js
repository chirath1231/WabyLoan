// Fallback until /master-data (master_sectors) loads.
export const SECTORS = [
  { id: 'government', label: 'Government' },
  { id: 'semi_government', label: 'Semi-Government' },
  { id: 'private', label: 'Private Sector' },
  { id: 'self_employed', label: 'Self-Employed' },
];

export const RETIREMENT_AGE_DEFAULT = {
  government: 60, semi_government: 60, private: 60, self_employed: 65,
};

export function defaultRetirementAge(sectorId) {
  return RETIREMENT_AGE_DEFAULT[sectorId] ?? 60;
}

export function maxValidApplicantAge(loanCategory) {
  return loanCategory === 'pension' ? 85 : 70;
}

export function isValidAge(age, loanCategory) {
  return typeof age === 'number' && !Number.isNaN(age) && age >= 18 && age <= maxValidApplicantAge(loanCategory);
}

export function initialWizardState() {
  return {
    loanCategory: null,
    sector: null,
    occupation: null,
    customOccupation: '',
    applicant: { age: null, retirementAge: null, gender: null, jointApplicant: false, coApplicantIncome: 0 },
    employerName: '',
    employmentMonths: null,
    otMonthlyAverage: 0,
    otherIncomeMonthly: 0,
    business: { revenue: 0, expenses: 0 },
    pensionIncome: 0,
    selfEmployedIncome: 0,
    payslip: {
      mode: 'manual',
      manual: {
        simpleMode: true, simpleNetSalary: 0,
        basic: 0, allowances: 0, deductions: 0, itemized: false,
        allowanceItems: [], deductionItems: [],
      },
      items: [],
      employee: null,
    },
    vehicle: { valuation: 0, year: new Date().getFullYear(), downPaymentPct: 10, balloon: false },
    housing: { propertyValue: 0, term: 15, downPaymentPct: 10 },
    termYears: 5,
    requestedAmount: null,
    hasExistingObligations: null,
    existingObligations: 0,
    settleExistingLoans: false,
    existingLoanBalance: 0,
  };
}
