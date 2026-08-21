import type { IncomeItem } from './types.js';

export interface ResolvedIncome {
  grossMonthlyIncome: number;
  /**
   * Sum of all *checked* deduction line items, regardless of their fixed/non-fixed tag.
   * The fixed/non-fixed flag governs whether a statutory item can be unchecked (UI concern
   * only) — it does not filter what counts toward the affordability deduction. This mirrors
   * the validated prototype's `fixedDeductionsTotal()` exactly.
   */
  deductionsTotal: number;
  netSalary: number;
}

/** Resolves gross income / deductions from an itemized payslip (OCR or manual itemized mode). */
export function resolveIncomeFromItems(items: IncomeItem[]): ResolvedIncome {
  const grossMonthlyIncome = items
    .filter((i) => i.type === 'earning' && i.checked)
    .reduce((sum, i) => sum + Number(i.amount || 0), 0);
  const deductionsTotal = items
    .filter((i) => i.type === 'deduction' && i.checked)
    .reduce((sum, i) => sum + Number(i.amount || 0), 0);
  return { grossMonthlyIncome, deductionsTotal, netSalary: grossMonthlyIncome - deductionsTotal };
}

/** Suggested EPF line (8% of Basic Salary), seeded on itemization and live-synced until manually edited. */
export function suggestEpf(basicSalary: number): number {
  return Math.round(Number(basicSalary || 0) * 0.08);
}
