export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

/** Appendix A.1 — EMI from principal. */
export function emiFromPrincipal(principal: number, annualRatePct: number, months: number): number {
  if (months <= 0) return 0;
  const r = annualRatePct / 100 / 12;
  if (r === 0) return principal / months;
  const factor = Math.pow(1 + r, months);
  return (principal * r * factor) / (factor - 1);
}

/** Appendix A.2 — reverse: maximum principal an EMI capacity can sustain. */
export function reversePrincipalFromEMI(emi: number, annualRatePct: number, months: number): number {
  if (months <= 0) return 0;
  const r = annualRatePct / 100 / 12;
  if (r === 0) return emi * months;
  const factor = Math.pow(1 + r, months);
  return (emi * (factor - 1)) / (r * factor);
}

/** Appendix A.3 — outstanding balance after k monthly payments. */
export function balanceAfterPayments(principal: number, annualRatePct: number, months: number, k: number): number {
  const r = annualRatePct / 100 / 12;
  const kk = clamp(k, 0, months);
  if (r === 0) return Math.max(principal - (principal / months) * kk, 0);
  const emi = emiFromPrincipal(principal, annualRatePct, months);
  const bal = principal * Math.pow(1 + r, kk) - (emi * (Math.pow(1 + r, kk) - 1)) / r;
  return Math.max(bal, 0);
}

export interface AmortizationYearRow {
  year: number;
  monthlyPayment: number;
  interestPaid: number;
  principalPaid: number;
  remainingBalance: number;
}

/** Full year-by-year amortization schedule for the loan's entire term (SRS §4.2). */
export function buildAmortizationSchedule(
  principal: number,
  annualRatePct: number,
  termYears: number,
): AmortizationYearRow[] {
  const months = termYears * 12;
  if (months <= 0 || principal <= 0) return [];
  const emi = emiFromPrincipal(principal, annualRatePct, months);
  const r = annualRatePct / 100 / 12;
  const rows: AmortizationYearRow[] = [];
  let balance = principal;
  for (let year = 1; year <= termYears; year++) {
    let interestPaidYear = 0;
    let principalPaidYear = 0;
    for (let m = 0; m < 12; m++) {
      if (balance <= 0) break;
      const interestPortion = r === 0 ? 0 : balance * r;
      let principalPortion = emi - interestPortion;
      if (principalPortion > balance) principalPortion = balance;
      interestPaidYear += interestPortion;
      principalPaidYear += principalPortion;
      balance = Math.max(balance - principalPortion, 0);
    }
    rows.push({
      year,
      monthlyPayment: emi,
      interestPaid: interestPaidYear,
      principalPaid: principalPaidYear,
      remainingBalance: balance,
    });
  }
  return rows;
}
