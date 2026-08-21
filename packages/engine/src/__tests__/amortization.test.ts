import { describe, expect, it } from 'vitest';
import { balanceAfterPayments, buildAmortizationSchedule, emiFromPrincipal, reversePrincipalFromEMI } from '../amortization.js';

describe('emiFromPrincipal', () => {
  it('computes standard amortizing EMI', () => {
    // 1,000,000 @ 12% for 5 years -> known EMI ~ 22,244.45
    const emi = emiFromPrincipal(1_000_000, 12, 60);
    expect(emi).toBeCloseTo(22244.45, 1);
  });

  it('falls back to simple division when rate is zero', () => {
    expect(emiFromPrincipal(120_000, 0, 12)).toBeCloseTo(10_000, 6);
  });

  it('returns 0 for non-positive months', () => {
    expect(emiFromPrincipal(100_000, 10, 0)).toBe(0);
  });
});

describe('reversePrincipalFromEMI', () => {
  it('round-trips with emiFromPrincipal', () => {
    const principal = 2_500_000;
    const rate = 13.5;
    const months = 84;
    const emi = emiFromPrincipal(principal, rate, months);
    const recovered = reversePrincipalFromEMI(emi, rate, months);
    expect(recovered).toBeCloseTo(principal, 0);
  });
});

describe('balanceAfterPayments', () => {
  it('is 0 at full term and principal at k=0', () => {
    const principal = 1_000_000;
    const rate = 11;
    const months = 60;
    expect(balanceAfterPayments(principal, rate, months, 0)).toBeCloseTo(principal, 0);
    expect(balanceAfterPayments(principal, rate, months, months)).toBeCloseTo(0, 0);
  });

  it('handles zero rate linearly', () => {
    expect(balanceAfterPayments(120_000, 0, 12, 6)).toBeCloseTo(60_000, 6);
  });
});

describe('buildAmortizationSchedule', () => {
  it('ends the final year at (near) zero balance and sums principal to the loan amount', () => {
    const principal = 1_800_000;
    const rate = 12.5;
    const years = 6;
    const rows = buildAmortizationSchedule(principal, rate, years);
    expect(rows).toHaveLength(years);
    expect(rows[rows.length - 1].remainingBalance).toBeCloseTo(0, 0);
    const totalPrincipalPaid = rows.reduce((s, r) => s + r.principalPaid, 0);
    expect(totalPrincipalPaid).toBeCloseTo(principal, 0);
  });
});
