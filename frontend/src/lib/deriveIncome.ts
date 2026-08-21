import { resolveIncomeFromItems } from '@wabyloan/engine';
import type { WizardState } from '@/store/wizardStore';

/** Resolves the engine's IncomeProfile from whichever Step 3 mode the wizard is currently in. */
export function deriveIncomeProfile(state: WizardState): { grossMonthlyIncome: number; deductionsTotal: number } {
  if (state.loanCategory === 'business') {
    return { grossMonthlyIncome: state.businessRevenue, deductionsTotal: 0 };
  }
  if (state.sector === 'self_employed') {
    return { grossMonthlyIncome: state.selfEmployedIncome, deductionsTotal: 0 };
  }
  if (state.incomeMode === 'ocr') {
    return resolveIncomeFromItems(state.ocrItems);
  }
  if (state.manualItemized) {
    // Basic Salary is always a separate top-level field in manual mode — only the
    // allowances/deductions portions switch between itemized and flat entry (SRS §3.3).
    const allowanceTotal = state.manualAllowanceItems.filter((i) => i.checked).reduce((s, i) => s + Number(i.amount || 0), 0);
    const deductionTotal = state.manualDeductionItems.filter((i) => i.checked).reduce((s, i) => s + Number(i.amount || 0), 0);
    return { grossMonthlyIncome: state.manualBasic + allowanceTotal, deductionsTotal: deductionTotal };
  }
  return {
    grossMonthlyIncome: state.manualBasic + state.manualAllowances,
    deductionsTotal: state.manualDeductions,
  };
}
