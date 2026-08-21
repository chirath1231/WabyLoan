import { describe, expect, it } from 'vitest';
import { runEligibilityEngine } from '../eligibility.js';
import type { Bank, EligibilityInput } from '../types.js';
import { TEST_BANKS, TEST_CONFIG, TEST_OCCUPATIONS } from './fixtures.js';

function baseInput(overrides: Partial<EligibilityInput> = {}): EligibilityInput {
  return {
    applicant: {
      loanCategory: 'personal',
      sector: 'private',
      occupationId: 'general',
      age: 30,
      retirementAge: 60,
      jointApplicant: false,
      coApplicantIncome: 0,
    },
    income: { grossMonthlyIncome: 250_000, deductionsTotal: 40_000 },
    categoryDetails: {},
    obligations: { existingMonthlyObligations: 0, settleWithNewLoan: false, outstandingBalanceToSettle: 0 },
    requestedTermYears: 5,
    currentYear: 2026,
    ...overrides,
  };
}

describe('ranking — Total Cost of Credit (SRS §3.5.1, must not regress)', () => {
  it('sorts eligible results ascending by totalCostOfCredit, not by totalOutlay/principal', () => {
    const result = runEligibilityEngine(baseInput(), TEST_BANKS, TEST_OCCUPATIONS, TEST_CONFIG);
    const eligible = result.results.filter((r) => !r.ineligible);
    expect(eligible.length).toBeGreaterThan(1);

    const sortedByCost = [...eligible].sort((a, b) => (a.totalCostOfCredit ?? 0) - (b.totalCostOfCredit ?? 0));
    expect(eligible.map((r) => r.variantKey)).toEqual(sortedByCost.map((r) => r.variantKey));

    // Guard against a regression to ranking by the literal all-in figure (which includes
    // principal) — for this fixture the two orderings must actually diverge, proving the
    // engine is not accidentally sorting by totalOutlay/principal instead.
    const sortedByOutlay = [...eligible].sort((a, b) => (a.totalOutlay ?? 0) - (b.totalOutlay ?? 0));
    expect(eligible.map((r) => r.variantKey)).not.toEqual(sortedByOutlay.map((r) => r.variantKey));
  });

  it('places all ineligible results after all eligible results', () => {
    const result = runEligibilityEngine(baseInput({ applicant: { ...baseInput().applicant, sector: 'private' } }), TEST_BANKS, TEST_OCCUPATIONS, TEST_CONFIG);
    const firstIneligibleIdx = result.results.findIndex((r) => r.ineligible);
    if (firstIneligibleIdx === -1) return;
    expect(result.results.slice(firstIneligibleIdx).every((r) => r.ineligible)).toBe(true);
  });
});

describe('loan amount rounding edge case (SRS §3.5.2 / A.7, must not regress)', () => {
  it('marks a bank ineligible (not LKR 0 eligible) when the raw eligible amount rounds down to zero', () => {
    const lowIncomeInput = baseInput({
      income: { grossMonthlyIncome: 4_000, deductionsTotal: 0 },
      requestedTermYears: 1,
    });
    const lbFinanceOnly: Bank[] = TEST_BANKS.filter((b) => b.id === 'lbfinance');
    const result = runEligibilityEngine(lowIncomeInput, lbFinanceOnly, TEST_OCCUPATIONS, TEST_CONFIG);
    expect(result.results).toHaveLength(1);
    const r = result.results[0];
    expect(r.ineligible).toBe(true);
    expect(r.ineligibleReason).toMatch(/minimum sanction increment/);
    expect(r.maxLoan).toBeUndefined();
  });

  it('rounds a genuinely large eligible amount down to the configured increment', () => {
    const result = runEligibilityEngine(baseInput(), TEST_BANKS, TEST_OCCUPATIONS, TEST_CONFIG);
    const eligible = result.results.filter((r) => !r.ineligible);
    eligible.forEach((r) => {
      expect(Number(r.maxLoan) % TEST_CONFIG.loanRoundingStep).toBe(0);
    });
  });
});

describe('dual-scheme gating asymmetry (SRS §3.5.3, must not regress)', () => {
  it('gates the Special Scheme by targetOccupation but leaves the General Scheme available regardless', () => {
    // peoples: allowedSectors=[government], targetOccupation='doctor'.
    // Applicant is an eligible-profession engineer (not a doctor) in the government sector:
    // whole-bank sector gate passes, but the Special Scheme should be excluded while General
    // Scheme still appears.
    const input = baseInput({
      applicant: {
        loanCategory: 'professional',
        sector: 'government',
        occupationId: 'engineer',
        age: 35,
        retirementAge: 60,
        jointApplicant: false,
        coApplicantIncome: 0,
      },
    });
    const result = runEligibilityEngine(input, TEST_BANKS, TEST_OCCUPATIONS, TEST_CONFIG);
    expect(result.dualSchemeMode).toBe(true);

    const peoplesSpecial = result.results.find((r) => r.variantKey === 'peoples__special');
    const peoplesGeneral = result.results.find((r) => r.variantKey === 'peoples__general');
    expect(peoplesSpecial).toBeUndefined();
    expect(peoplesGeneral).toBeDefined();
  });

  it('offers both variants when the applicant matches the target occupation', () => {
    const input = baseInput({
      applicant: {
        loanCategory: 'professional',
        sector: 'government',
        occupationId: 'doctor',
        age: 35,
        retirementAge: 60,
        jointApplicant: false,
        coApplicantIncome: 0,
      },
    });
    const result = runEligibilityEngine(input, TEST_BANKS, TEST_OCCUPATIONS, TEST_CONFIG);
    expect(result.results.find((r) => r.variantKey === 'peoples__special')).toBeDefined();
    expect(result.results.find((r) => r.variantKey === 'peoples__general')).toBeDefined();
  });

  it('gates both variants when the sector is outside the bank allowedSectors list', () => {
    const input = baseInput({
      applicant: {
        loanCategory: 'professional',
        sector: 'private', // peoples only allows 'government'
        occupationId: 'doctor',
        age: 35,
        retirementAge: 60,
        jointApplicant: false,
        coApplicantIncome: 0,
      },
    });
    const result = runEligibilityEngine(input, TEST_BANKS, TEST_OCCUPATIONS, TEST_CONFIG);
    expect(result.results.find((r) => r.variantKey === 'peoples__special')).toBeUndefined();
    expect(result.results.find((r) => r.variantKey === 'peoples__general')).toBeUndefined();
    const peoplesResult = result.results.find((r) => r.bankId === 'peoples');
    expect(peoplesResult?.ineligible).toBe(true);
    expect(peoplesResult?.ineligibleReason).toMatch(/Government sector/);
  });

  it('gates the Professional Loan category entirely for a non-eligible profession', () => {
    const input = baseInput({
      applicant: {
        loanCategory: 'professional',
        sector: 'private',
        occupationId: 'general',
        age: 35,
        retirementAge: 60,
        jointApplicant: false,
        coApplicantIncome: 0,
      },
    });
    const result = runEligibilityEngine(input, TEST_BANKS, TEST_OCCUPATIONS, TEST_CONFIG);
    expect(result.professionalGate).toBe(true);
    expect(result.dualSchemeMode).toBe(false);
    expect(result.results.every((r) => r.ineligible)).toBe(true);
  });
});

describe('hard gates', () => {
  it('marks a vehicle over 15 years old ineligible with an explicit reason', () => {
    const input = baseInput({
      applicant: { ...baseInput().applicant, loanCategory: 'vehicle' },
      categoryDetails: { vehicle: { valuationLkr: 5_000_000, manufactureYear: 2005, downPaymentPct: 20, balloonPayment: false } },
      currentYear: 2026,
    });
    const result = runEligibilityEngine(input, TEST_BANKS, TEST_OCCUPATIONS, TEST_CONFIG);
    expect(result.results.every((r) => r.ineligible)).toBe(true);
    expect(result.results[0].ineligibleReason).toMatch(/15-year/);
  });

  it('marks every bank ineligible once the retirement-age tenure cap reaches zero', () => {
    const input = baseInput({
      applicant: { ...baseInput().applicant, age: 61, retirementAge: 60 },
    });
    const result = runEligibilityEngine(input, TEST_BANKS, TEST_OCCUPATIONS, TEST_CONFIG);
    expect(result.ageCapYears).toBe(0);
    expect(result.results.every((r) => r.ineligible)).toBe(true);
    expect(result.results.some((r) => /retirement-age/.test(r.ineligibleReason ?? ''))).toBe(true);
  });
});
