import { clamp, emiFromPrincipal, reversePrincipalFromEMI } from './amortization.js';
import type {
  Bank,
  EligibilityInput,
  EligibilityResult,
  EngineConfig,
  EngineRunResult,
  LoanCategory,
  Occupation,
  Sector,
  TermCapReason,
} from './types.js';

const LOAN_LABELS: Record<LoanCategory, string> = {
  personal: 'Personal Loan',
  professional: 'Professional Loan',
  housing: 'Housing Loan',
  vehicle: 'Vehicle Leasing',
  business: 'Business Loan',
};

const SECTOR_LABELS: Record<Sector, string> = {
  government: 'Government',
  semi_government: 'Semi-Government',
  private: 'Private Sector',
  self_employed: 'Self-Employed',
};

const TARGET_OCC_LABELS: Record<string, string> = {
  doctor: 'Doctors',
  engineer: 'Engineers',
  gov_exec: 'Government Executives',
};

export function getDtiPercent(sector: Sector, config: EngineConfig): number {
  const dti = config.dtiBySector[sector] ?? 60;
  return clamp(dti, 10, 90);
}

export function getRetirementCapYears(age: number, retirementAge: number): number {
  return Math.max(Number(retirementAge || 60) - Number(age || 0), 0);
}

/** Longest tenure any active bank actually offers for the category — bounds the Step 5 term slider. */
export function getMaxTermAcrossBanks(category: LoanCategory, banks: Bank[]): number {
  const caps = banks.filter((b) => b.active).map((b) => b.maxTermYears[category] || 0);
  return Math.max(...caps, 1);
}

function resolveRequestedTerm(input: EligibilityInput): number {
  if (input.requestedTermYears && input.requestedTermYears > 0) return input.requestedTermYears;
  if (input.applicant.loanCategory === 'housing' && input.categoryDetails.housing) {
    return input.categoryDetails.housing.repaymentDurationYears;
  }
  return 5;
}

function getEffectiveTermYears(
  bank: Bank,
  variantCat: LoanCategory,
  requested: number,
  ageCapYears: number,
  termCapOverride?: number | null,
): number {
  const bankCap = termCapOverride != null ? Number(termCapOverride) : bank.maxTermYears[variantCat] ?? 0;
  return Math.max(Math.min(requested, bankCap, ageCapYears), 0);
}

function getTermCapReason(
  bank: Bank,
  variantCat: LoanCategory,
  requested: number,
  ageCapYears: number,
  termCapOverride?: number | null,
): TermCapReason {
  const bankCap = termCapOverride != null ? Number(termCapOverride) : bank.maxTermYears[variantCat] ?? 0;
  const actual = getEffectiveTermYears(bank, variantCat, requested, ageCapYears, termCapOverride);
  if (actual >= requested) return null;
  return bankCap <= ageCapYears ? 'bank max' : 'age limit';
}

function vehicleAgeIneligible(input: EligibilityInput): boolean {
  if (input.applicant.loanCategory !== 'vehicle' || !input.categoryDetails.vehicle) return false;
  const currentYear = input.currentYear ?? new Date().getFullYear();
  const age = currentYear - Number(input.categoryDetails.vehicle.manufactureYear);
  return age > 15;
}

interface AssetCap {
  assetValue: number;
  downPayment: number;
  cap: number;
}

function getAssetCap(input: EligibilityInput): AssetCap | null {
  const cat = input.applicant.loanCategory;
  if (cat === 'vehicle' && input.categoryDetails.vehicle) {
    const v = input.categoryDetails.vehicle;
    const dp = v.downPaymentPct / 100;
    return { assetValue: v.valuationLkr, downPayment: v.valuationLkr * dp, cap: v.valuationLkr * (1 - dp) };
  }
  if (cat === 'housing' && input.categoryDetails.housing) {
    const h = input.categoryDetails.housing;
    const dp = h.downPaymentPct / 100;
    return { assetValue: h.propertyValueLkr, downPayment: h.propertyValueLkr * dp, cap: h.propertyValueLkr * (1 - dp) };
  }
  return null;
}

function getLegalFee(input: EligibilityInput): number {
  if (input.applicant.loanCategory !== 'housing' || !input.categoryDetails.housing) return 0;
  const h = input.categoryDetails.housing;
  return Math.min(h.propertyValueLkr * (h.legalFeePct / 100), h.legalFeeCap);
}

function isEligibleProfession(occupationId: string, occupations: Occupation[]): boolean {
  const occ = occupations.find((o) => o.id === occupationId);
  return occ ? occ.isSpecialSchemeEligible : false;
}

function isSpecialOccupation(occupationId: string, occupations: Occupation[], config: EngineConfig): boolean {
  if (!config.specialOccupationEnabled) return false;
  return isEligibleProfession(occupationId, occupations);
}

/** Gross income for DTI purposes: resolved income plus co-applicant income (all categories except Business). */
function computeGrossForDti(input: EligibilityInput): number {
  if (input.applicant.loanCategory === 'business') {
    return input.categoryDetails.business?.avgMonthlyRevenue ?? 0;
  }
  let gross = input.income.grossMonthlyIncome;
  if (input.applicant.jointApplicant) gross += Number(input.applicant.coApplicantIncome || 0);
  return gross;
}

function fixedDeductionsTotal(input: EligibilityInput): number {
  if (input.applicant.loanCategory === 'business' || input.applicant.sector === 'self_employed') return 0;
  return input.income.deductionsTotal;
}

interface VariantOpts {
  termCapOverride?: number | null;
  rateOverride?: number | null;
  rateAdjust?: number;
  docChargePctOverride?: number | null;
  remarksList: string[];
  variantLabel: string | null;
  variantKey: string;
  schemeApplied: boolean;
}

/**
 * Evaluates one bank under one specific product variant (its own term cap, rate adjustment,
 * doc charge, and remarks). Shared by both single-variant and dual-variant (Professional Loan)
 * modes so there is exactly one place the loan math happens.
 */
function evaluateVariant(
  bank: Bank,
  variantCat: LoanCategory,
  opts: VariantOpts,
  ctx: {
    emiCapacity: number;
    ageCapYears: number;
    requestedTerm: number;
    assetCap: AssetCap | null;
    settleWithNewLoan: boolean;
    outstandingBalanceToSettle: number;
    roundingStep: number;
    legalFee: number;
    vehicleIneligible: boolean;
  },
): EligibilityResult {
  const base = {
    bankId: bank.id,
    bankName: bank.name,
    bankShortName: bank.shortName,
    bankType: bank.type,
    sponsored: bank.sponsored,
    color: bank.color,
    updatedDate: bank.updatedDate,
    variantKey: opts.variantKey,
    variantLabel: opts.variantLabel,
    schemeApplied: opts.schemeApplied,
    remarks: [] as string[],
  };

  const bankCap = opts.termCapOverride != null ? Number(opts.termCapOverride) : bank.maxTermYears[variantCat] ?? 0;
  if (bankCap === 0) {
    const reason = opts.variantLabel
      ? `${bank.name} does not offer a dedicated ${opts.variantLabel} — see their General Scheme card instead, if shown below.`
      : `${bank.name} does not offer ${LOAN_LABELS[variantCat]}.`;
    return { ...base, ineligible: true, ineligibleReason: reason };
  }
  if (ctx.vehicleIneligible) {
    return { ...base, ineligible: true, ineligibleReason: 'Vehicle exceeds 15-year manufacture age limit for leasing.' };
  }
  if (ctx.ageCapYears <= 0) {
    return {
      ...base,
      ineligible: true,
      ineligibleReason: 'Applicant age plus loan tenure exceeds the retirement-age policy limit.',
    };
  }

  const termYears = getEffectiveTermYears(bank, variantCat, ctx.requestedTerm, ctx.ageCapYears, opts.termCapOverride);
  const termCapReason = getTermCapReason(bank, variantCat, ctx.requestedTerm, ctx.ageCapYears, opts.termCapOverride);
  const months = termYears * 12;
  const rate =
    opts.rateOverride != null ? Math.max(Number(opts.rateOverride), 1) : Math.max(bank.baseRate + (opts.rateAdjust || 0), 1);
  const docChargePct = opts.docChargePctOverride != null ? Number(opts.docChargePctOverride) : bank.docChargePct;

  let maxLoan = reversePrincipalFromEMI(ctx.emiCapacity, rate, months);
  let cappedByAsset = false;
  if (ctx.assetCap && maxLoan > ctx.assetCap.cap) {
    maxLoan = ctx.assetCap.cap;
    cappedByAsset = true;
  }
  maxLoan = Math.max(maxLoan, 0);

  // Real-world banks never sanction odd rupee amounts — round down to the nearest configured
  // increment. A genuinely eligible but small raw amount that rounds all the way to zero is a
  // real "too small to sanction" outcome, not silent zero eligibility (SRS §3.5.2 / A.7).
  const rawMaxLoan = maxLoan;
  if (ctx.roundingStep > 0) {
    maxLoan = Math.floor(maxLoan / ctx.roundingStep) * ctx.roundingStep;
  }
  if (maxLoan <= 0 && rawMaxLoan > 0) {
    return {
      ...base,
      ineligible: true,
      ineligibleReason: `Eligible amount (approx. LKR ${Math.round(rawMaxLoan).toLocaleString(
        'en-LK',
      )}) falls below ${bank.name}'s minimum sanction increment of LKR ${ctx.roundingStep.toLocaleString(
        'en-LK',
      )} once rounded to standard multiples.`,
    };
  }

  const emi = emiFromPrincipal(maxLoan, rate, months);
  const docCharge = clamp(maxLoan * (docChargePct / 100), bank.docChargeMin, bank.docChargeCap);
  const totalRepayment = emi * months;
  const totalInterest = totalRepayment - maxLoan;
  const totalCostOfCredit = totalInterest + docCharge; // ranking metric — principal excluded
  const totalOutlay = maxLoan + totalInterest + docCharge; // display-only literal all-in figure
  const emiPlus1 = emiFromPrincipal(maxLoan, rate + 1, months);
  const emiPlus2 = emiFromPrincipal(maxLoan, rate + 2, months);
  const netCashInHand = ctx.settleWithNewLoan ? maxLoan - Number(ctx.outstandingBalanceToSettle || 0) : null;

  return {
    ...base,
    remarks: opts.remarksList,
    ineligible: false,
    ineligibleReason: null,
    rate,
    termYears,
    termCapReason,
    months,
    maxLoan,
    emi,
    docCharge,
    legalFee: ctx.legalFee,
    totalRepayment,
    totalInterest,
    totalCostOfCredit,
    totalOutlay,
    cappedByAsset,
    emiPlus1,
    emiPlus2,
    netCashInHand,
    downPayment: ctx.assetCap ? ctx.assetCap.downPayment : 0,
  };
}

/**
 * Pure, stateless eligibility engine: given an applicant profile and a bank/occupation dataset
 * snapshot, returns a ranked result set. Safe to run identically on the server and (later)
 * on-device for instant UI feedback — no hidden global state, no I/O.
 */
export function runEligibilityEngine(
  input: EligibilityInput,
  banks: Bank[],
  occupations: Occupation[],
  config: EngineConfig,
): EngineRunResult {
  const gross = computeGrossForDti(input);
  const dtiPct = getDtiPercent(input.applicant.sector, config);
  const fixedDeductions = fixedDeductionsTotal(input);
  const ageCapYears = getRetirementCapYears(input.applicant.age, input.applicant.retirementAge);
  const requestedTerm = resolveRequestedTerm(input);

  const obligationsDeduction = input.obligations.settleWithNewLoan ? 0 : Number(input.obligations.existingMonthlyObligations || 0);
  const emiCapacity = Math.max(gross * (dtiPct / 100) - fixedDeductions - obligationsDeduction, 0);
  const vehicleIneligible = vehicleAgeIneligible(input);
  const assetCap = getAssetCap(input);
  const legalFee = getLegalFee(input);
  const cat = input.applicant.loanCategory;
  const professionalGate = cat === 'professional' && !isEligibleProfession(input.applicant.occupationId, occupations);
  // Dual-scheme mode: an eligible professional comparing "Professional Loan" sees BOTH a bank's
  // discounted Special Scheme (stricter guarantor conditions) and its General Scheme (broader
  // eligibility, standard conditions) side by side (SRS §3.5.3).
  const dualSchemeMode = cat === 'professional' && !professionalGate;

  const ctx = {
    emiCapacity,
    ageCapYears,
    requestedTerm,
    assetCap,
    settleWithNewLoan: input.obligations.settleWithNewLoan,
    outstandingBalanceToSettle: input.obligations.outstandingBalanceToSettle,
    roundingStep: Number(config.loanRoundingStep || 0),
    legalFee,
    vehicleIneligible,
  };

  const occObj = occupations.find((o) => o.id === input.applicant.occupationId);
  const occLabel = occObj ? occObj.label : 'Professional';

  const results: EligibilityResult[] = [];

  function ineligibleBankResult(bank: Bank, reason: string): EligibilityResult {
    return {
      bankId: bank.id,
      bankName: bank.name,
      bankShortName: bank.shortName,
      bankType: bank.type,
      sponsored: bank.sponsored,
      color: bank.color,
      updatedDate: bank.updatedDate,
      variantKey: bank.id,
      variantLabel: null,
      schemeApplied: false,
      remarks: [],
      ineligible: true,
      ineligibleReason: reason,
    };
  }

  banks
    .filter((b) => b.active)
    .forEach((bank) => {
      if (professionalGate) {
        results.push(
          ineligibleBankResult(
            bank,
            'Professional Loan scheme requires an eligible profession (Doctor, Engineer, Accountant, Government Executive, or Lawyer).',
          ),
        );
        return;
      }

      // Sector policy is a whole-bank restriction — applies to every variant of this bank.
      if (bank.allowedSectors && !bank.allowedSectors.includes(input.applicant.sector)) {
        const allowedLabel = bank.allowedSectors.map((s) => SECTOR_LABELS[s] || s).join(' / ');
        results.push(ineligibleBankResult(bank, `Restricted to ${allowedLabel} sector applicants only.`));
        return;
      }

      if (dualSchemeMode) {
        // Special Scheme: only offered if the bank's target-occupation restriction (if any)
        // matches. The General Scheme fallback deliberately has broader eligibility and is not
        // gated by it (SRS §3.5.3 gating asymmetry).
        const matchesTargetOcc =
          !bank.targetOccupation || bank.targetOccupation === 'all' || bank.targetOccupation === input.applicant.occupationId;
        if (matchesTargetOcc) {
          const hasExplicitRate = bank.specialRate != null;
          const schemeDiscount = config.professionalSchemeEnabled ? config.professionalSchemeDiscount : 0;
          results.push(
            evaluateVariant(
              bank,
              'professional',
              {
                rateOverride: hasExplicitRate ? bank.specialRate : null,
                rateAdjust: hasExplicitRate ? 0 : -schemeDiscount,
                docChargePctOverride: bank.specialDocChargePct,
                termCapOverride: bank.specialMaxTermYears,
                remarksList: bank.specialSchemeRemarks,
                variantLabel: `${occLabel} Special Scheme`,
                variantKey: `${bank.id}__special`,
                schemeApplied: true,
              },
              ctx,
            ),
          );
        }
        // General Scheme: the bank's standard personal-loan product, still with the modest
        // across-the-board professional courtesy rate (not the deeper dedicated discount).
        const stdDiscount = config.specialOccupationEnabled ? config.specialOccupationDiscount : 0;
        results.push(
          evaluateVariant(
            bank,
            'personal',
            {
              rateAdjust: -stdDiscount,
              remarksList: bank.remarks,
              variantLabel: `General ${LOAN_LABELS.personal}`,
              variantKey: `${bank.id}__general`,
              schemeApplied: false,
            },
            ctx,
          ),
        );
      } else {
        if (bank.targetOccupation && bank.targetOccupation !== 'all' && input.applicant.occupationId !== bank.targetOccupation) {
          results.push(
            ineligibleBankResult(
              bank,
              `Restricted to ${TARGET_OCC_LABELS[bank.targetOccupation] || bank.targetOccupation} only.`,
            ),
          );
          return;
        }
        const rateAdjust = isSpecialOccupation(input.applicant.occupationId, occupations, config)
          ? -config.specialOccupationDiscount
          : 0;
        results.push(
          evaluateVariant(
            bank,
            cat,
            {
              rateAdjust,
              remarksList: bank.remarks,
              variantLabel: null,
              variantKey: bank.id,
              schemeApplied: false,
            },
            ctx,
          ),
        );
      }
    });

  const eligible = results.filter((r) => !r.ineligible).sort((a, b) => (a.totalCostOfCredit ?? 0) - (b.totalCostOfCredit ?? 0));
  const ineligible = results.filter((r) => r.ineligible);

  return {
    results: [...eligible, ...ineligible],
    emiCapacity,
    dtiPctUsed: dtiPct,
    ageCapYears,
    professionalGate,
    dualSchemeMode,
  };
}
