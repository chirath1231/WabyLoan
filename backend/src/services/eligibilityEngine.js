// Ported from the original client-side prototype (waby-loan (13) (1).html,
// lines ~682-1166: computeBaseIncome / runEligibilityEngine and helpers). This is
// the core business logic — bank rate comparison, EMI/DTI math — moved server-side
// so the rules and rates aren't shipped to the browser. Behavior is preserved
// exactly; only the data source changed from a global `state`/`state.admin` object
// to explicit `input` (applicant answers) and `adminData` (banks/occupations/
// company lists/settings loaded from Postgres) parameters.

const LOAN_LABELS = {
  personal: 'Personal Loan',
  professional: 'Professional Loan',
  housing: 'Housing Loan',
  vehicle: 'Vehicle Leasing',
  pension: 'Pension Loan',
  business: 'Business Loan',
};

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function fmt(n) {
  n = Math.round(n || 0);
  return 'LKR ' + n.toLocaleString('en-LK');
}

function reversePrincipalFromEMI(emi, annualRatePct, months) {
  if (months <= 0) return 0;
  const r = annualRatePct / 100 / 12;
  if (r === 0) return emi * months;
  const factor = Math.pow(1 + r, months);
  return (emi * (factor - 1)) / (r * factor);
}
function emiFromPrincipal(principal, annualRatePct, months) {
  if (months <= 0) return 0;
  const r = annualRatePct / 100 / 12;
  if (r === 0) return principal / months;
  const factor = Math.pow(1 + r, months);
  return (principal * r * factor) / (factor - 1);
}
function reversePrincipalFromEMIFlat(emi, annualRatePct, months) {
  if (months <= 0) return 0;
  const years = months / 12;
  const totalRateFactor = 1 + (annualRatePct / 100) * years;
  return (emi * months) / totalRateFactor;
}
function emiFromPrincipalFlat(principal, annualRatePct, months) {
  if (months <= 0) return 0;
  const years = months / 12;
  return (principal * (1 + (annualRatePct / 100) * years)) / months;
}
// Outstanding balance after k monthly payments on an amortizing loan.
export function balanceAfterPayments(principal, annualRatePct, months, k) {
  const r = annualRatePct / 100 / 12;
  const kk = clamp(k, 0, months);
  if (r === 0) return Math.max(principal - (principal / months) * kk, 0);
  const emi = emiFromPrincipal(principal, annualRatePct, months);
  const bal = principal * Math.pow(1 + r, kk) - emi * ((Math.pow(1 + r, kk) - 1) / r);
  return Math.max(bal, 0);
}

function computeBaseIncome(input) {
  if (input.loanCategory === 'business') return Number(input.business?.revenue || 0);
  if (input.loanCategory === 'pension') return Number(input.pensionIncome || 0);
  if (input.sector === 'self_employed') return Number(input.selfEmployedIncome || 0);
  if (input.payslip?.mode === 'manual') {
    const m = input.payslip.manual || {};
    if (m.simpleMode) return Number(m.simpleNetSalary || 0);
    const allowanceTotal = m.itemized
      ? (m.allowanceItems || []).filter((i) => i.checked).reduce((s, i) => s + Number(i.amount || 0), 0)
      : Number(m.allowances || 0);
    return Number(m.basic || 0) + allowanceTotal;
  }
  const items = input.payslip?.items || [];
  return items.filter((i) => i.type === 'earning' && i.checked).reduce((s, i) => s + Number(i.amount || 0), 0);
}

function jointApplicantIncomeContribution(input) {
  if (input.loanCategory !== 'housing') return 0;
  return input.applicant?.jointApplicant ? Number(input.applicant?.coApplicantIncome || 0) : 0;
}

function otMonthlyAverageContribution(input) {
  if (input.loanCategory === 'business' || input.loanCategory === 'pension' || input.sector === 'self_employed') return 0;
  return Number(input.otMonthlyAverage || 0);
}

// Product-specific qualifying income = Base + Joint applicant (if Housing) +
// (OT average, only if this product's otIncluded allows it) +
// (Other income x this product's otherIncomePct, 0 = not considered).
function computeQualifyingIncome(input, product) {
  let g = computeBaseIncome(input);
  g += jointApplicantIncomeContribution(input);
  const otAllowed = product ? product.otIncluded !== false : true;
  if (otAllowed) g += otMonthlyAverageContribution(input);
  const otherIncomePct = product ? Number(product.otherIncomePct || 0) : 0;
  if (otherIncomePct > 0) g += Number(input.otherIncomeMonthly || 0) * (otherIncomePct / 100);
  return g;
}

function computeGrossForDTI(input) {
  return computeQualifyingIncome(input, null);
}

function fixedDeductionsTotal(input) {
  if (input.loanCategory === 'business' || input.loanCategory === 'pension' || input.sector === 'self_employed') return 0;
  if (input.payslip?.mode === 'manual') {
    const m = input.payslip.manual || {};
    if (m.simpleMode) return 0; // already netted out of simpleNetSalary above
    return m.itemized
      ? (m.deductionItems || []).filter((i) => i.checked).reduce((s, i) => s + Number(i.amount || 0), 0)
      : Number(m.deductions || 0);
  }
  return (input.payslip?.items || []).filter((i) => i.type === 'deduction' && i.checked).reduce((s, i) => s + Number(i.amount || 0), 0);
}

function getDtiPercent(input, adminData) {
  const sectorKey = input.sector || 'private';
  const dti = adminData.dti[sectorKey] ?? 60;
  return clamp(dti, 10, 90);
}

function getRetirementCapYears(input) {
  const retireAt = Number(input.applicant?.retirementAge || 60);
  return Math.max(retireAt - Number(input.applicant?.age || 0), 0);
}

function getDefaultTermYears(input, bank, catOverride, bankCapOverride) {
  const cat = catOverride || input.loanCategory || 'personal';
  const bankCap = bankCapOverride != null && bankCapOverride !== '' ? Number(bankCapOverride) : bank.maxTermYears[cat] ?? 5;
  const requested = input.termYears || (cat === 'housing' ? input.housing?.term : 5);
  const ageCap = getRetirementCapYears(input);
  return Math.max(Math.min(requested, bankCap, ageCap), 0);
}
// Why a bank's term came out shorter than what the user asked for, if it did.
function getTermCapReason(input, bank, catOverride, bankCapOverride) {
  const cat = catOverride || input.loanCategory || 'personal';
  const bankCap = bankCapOverride != null && bankCapOverride !== '' ? Number(bankCapOverride) : bank.maxTermYears[cat] ?? 5;
  const requested = input.termYears || (cat === 'housing' ? input.housing?.term : 5);
  const ageCap = getRetirementCapYears(input);
  const actual = Math.max(Math.min(requested, bankCap, ageCap), 0);
  if (actual >= requested) return null;
  return bankCap <= ageCap ? 'bank max' : 'age limit';
}

function vehicleAgeIneligible(input) {
  if (input.loanCategory !== 'vehicle') return false;
  const age = new Date().getFullYear() - Number(input.vehicle?.year);
  return age > 15;
}

function isEligibleProfession(input, adminData) {
  const occ = adminData.occupations.find((o) => o.id === input.occupation);
  return occ ? occ.special : false;
}

function getAssetCap(input) {
  const cat = input.loanCategory;
  if (cat === 'vehicle') {
    const dp = (input.vehicle?.downPaymentPct || 0) / 100;
    const valuation = Number(input.vehicle?.valuation || 0);
    return { assetValue: valuation, downPayment: valuation * dp, cap: valuation * (1 - dp) };
  }
  if (cat === 'housing') {
    const dp = (input.housing?.downPaymentPct || 0) / 100;
    const propertyValue = Number(input.housing?.propertyValue || 0);
    return { assetValue: propertyValue, downPayment: propertyValue * dp, cap: propertyValue * (1 - dp) };
  }
  return null;
}

function getLegalFee(input) {
  if (input.loanCategory !== 'housing') return 0;
  const legalFeePct = input.housing?.legalFeePct ?? 0.3;
  const legalFeeCap = input.housing?.legalFeeCap ?? 100000;
  return Math.min(Number(input.housing?.propertyValue || 0) * (legalFeePct / 100), legalFeeCap);
}

// A product's rate for one rate type at this term, from its interest-rate tiers: a flat fixed_rate_value,
// or benchmark (AWPLR) + margin floored at floor_rate. null = not offered at this term (never a guess).
function resolveTierRate(tiers, termYears, rateTypeCode, benchmark) {
  const tier = tiers.find((t) => t.rateTypeCode === rateTypeCode && termYears >= t.minTermYears && termYears <= t.maxTermYears);
  if (!tier) return null;
  if (tier.fixedRateValue != null) return { rate: tier.fixedRateValue, rateType: rateTypeCode, benchmark: null };
  if (tier.marginOverAwplr == null || !benchmark || !(benchmark.rate > 0) || benchmark.active === false) return null;
  const floating = benchmark.rate + tier.marginOverAwplr;
  return {
    rate: tier.floorRate != null ? Math.max(floating, tier.floorRate) : floating,
    rateType: rateTypeCode,
    benchmark: { code: benchmark.code, label: benchmark.label, rate: benchmark.rate, margin: tier.marginOverAwplr, floorRate: tier.floorRate },
  };
}

function getCompanyList(adminData, listId) {
  if (!listId) return null;
  const list = adminData.companyLists.find((l) => l.id === listId);
  return list ? list.entries : null;
}

/**
 * @param {object} input - applicant answers, shaped like the prototype's `state` (see spec).
 * @param {object} adminData - { banks, occupations, companyLists, dti, loanRoundingStep }.
 */
export function runEligibilityEngine(rawInput, adminData) {
  // OT and other income only count where the sector/occupation income policy allows them (fail-closed:
  // a pair with no configured policy row counts neither).
  const policy = adminData.incomePolicies?.[rawInput.sector]?.[rawInput.occupation] || { otAllowed: false, otherIncomeAllowed: false };
  const input = {
    ...rawInput,
    otMonthlyAverage: policy.otAllowed ? rawInput.otMonthlyAverage : 0,
    otherIncomeMonthly: policy.otherIncomeAllowed ? rawInput.otherIncomeMonthly : 0,
  };
  const benchmarksByCode = new Map((adminData.benchmarks || []).map((b) => [b.code, b]));

  const gross = computeGrossForDTI(input);
  const dtiPct = getDtiPercent(input, adminData);
  const fixedDeductions = fixedDeductionsTotal(input);
  const ageCapYears = getRetirementCapYears(input);

  const obligationsDeduction = input.settleExistingLoans ? 0 : Number(input.existingObligations || 0);
  const emiCapacity = Math.max(gross * (dtiPct / 100) - fixedDeductions - obligationsDeduction, 0);
  const ineligibleVehicle = vehicleAgeIneligible(input);
  const assetCap = getAssetCap(input);
  const cat = input.loanCategory || 'personal';
  const dualSchemeMode = cat === 'personal' && isEligibleProfession(input, adminData);

  function evaluateVariant(bank, variantCat, opts) {
    const termCapOverride = opts.termCapOverride;
    const bankCap = termCapOverride != null && termCapOverride !== '' ? Number(termCapOverride) : bank.maxTermYears[variantCat] ?? 0;
    if (bankCap === 0) {
      const reason = opts.variantLabel
        ? `${bank.name} does not offer a dedicated ${opts.variantLabel} — see their General Scheme card instead, if shown below.`
        : `${bank.name} does not offer ${LOAN_LABELS[variantCat]}.`;
      return { bank, ineligible: true, reason, variantLabel: opts.variantLabel, variantKey: opts.variantKey };
    }
    if (ineligibleVehicle) {
      return { bank, ineligible: true, reason: 'Vehicle exceeds 15-year manufacture age limit for leasing.', variantLabel: opts.variantLabel, variantKey: opts.variantKey };
    }
    if (ageCapYears <= 0) {
      return { bank, ineligible: true, reason: 'Applicant age plus loan tenure exceeds the retirement-age policy limit.', variantLabel: opts.variantLabel, variantKey: opts.variantKey };
    }
    if (opts.ageMin && input.applicant?.age != null && input.applicant.age < Number(opts.ageMin)) {
      return { bank, ineligible: true, reason: `Minimum age for this product is ${opts.ageMin}.`, shortReason: '❌ Below Minimum Age', variantLabel: opts.variantLabel, variantKey: opts.variantKey };
    }

    const termYears = getDefaultTermYears(input, bank, variantCat, termCapOverride);
    const termCapReason = getTermCapReason(input, bank, variantCat, termCapOverride);
    const months = termYears * 12;

    if (opts.ageMaxAtMaturity && input.applicant?.age != null) {
      const ageAtMaturity = input.applicant.age + termYears;
      if (ageAtMaturity > Number(opts.ageMaxAtMaturity)) {
        return {
          bank, ineligible: true,
          reason: `Your age at the final installment (${ageAtMaturity}) would exceed this product's limit of ${opts.ageMaxAtMaturity}.`,
          shortReason: '❌ Exceeds Age Limit', variantLabel: opts.variantLabel, variantKey: opts.variantKey,
        };
      }
    }

    let rate;
    let rateType = opts.interestRateType || 'fixed';
    let benchmark = null;
    let rateOptions = null;
    if (opts.interestRateTiers && opts.interestRateTiers.length) {
      const bm = benchmarksByCode.get(opts.benchmarkCode || adminData.defaultBenchmarkCode);
      const fixed = resolveTierRate(opts.interestRateTiers, termYears, 'fixed', bm);
      const variable = resolveTierRate(opts.interestRateTiers, termYears, 'variable', bm);
      rateOptions = { fixed, variable };
      const best = [fixed, variable].filter(Boolean).sort((a, b) => a.rate - b.rate)[0];
      if (!best) {
        return {
          bank, ineligible: true,
          reason: `${bank.name} has no published rate for a ${termYears}-year term on this product.`,
          shortReason: '❌ Term Not Offered', variantLabel: opts.variantLabel, variantKey: opts.variantKey,
        };
      }
      rate = Math.max(best.rate, 1);
      rateType = best.rateType;
      benchmark = best.benchmark;
    } else {
      rate = opts.rateOverride != null && opts.rateOverride !== ''
        ? Math.max(Number(opts.rateOverride), 1)
        : Math.max(bank.baseRate + (opts.rateAdjust || 0), 1);
    }
    const isFlatRate = opts.interestRateType === 'flat';
    const docChargeBasis = opts.docChargeBasis || 'percent';
    const docChargePct = opts.docChargeValue != null && opts.docChargeValue !== '' && docChargeBasis !== 'fixed' ? Number(opts.docChargeValue) : bank.docChargePct;

    const baseIncome = computeBaseIncome(input);
    let effectiveEmiCapacity = emiCapacity;
    if ((opts.dtiOverride != null && opts.dtiOverride !== '') || opts.otherIncomePct || opts.otIncluded === false) {
      const effGross = computeQualifyingIncome(input, { otIncluded: opts.otIncluded, otherIncomePct: opts.otherIncomePct });
      const effDti = opts.dtiOverride != null && opts.dtiOverride !== '' ? Number(opts.dtiOverride) : dtiPct;
      effectiveEmiCapacity = Math.max(effGross * (effDti / 100) - fixedDeductions - obligationsDeduction, 0);
    }

    if (opts.minNetMonthlyIncome && baseIncome < Number(opts.minNetMonthlyIncome)) {
      return {
        bank, ineligible: true,
        reason: `Requires a minimum net monthly income of ${fmt(opts.minNetMonthlyIncome)} (yours is ${fmt(baseIncome)}).`,
        shortReason: '❌ Below Minimum Income', variantLabel: opts.variantLabel, variantKey: opts.variantKey,
      };
    }

    let maxLoan = isFlatRate
      ? reversePrincipalFromEMIFlat(effectiveEmiCapacity, rate, months)
      : reversePrincipalFromEMI(effectiveEmiCapacity, rate, months);
    let cappedByAsset = false;
    if (assetCap && maxLoan > assetCap.cap) {
      maxLoan = assetCap.cap;
      cappedByAsset = true;
    }
    maxLoan = Math.max(maxLoan, 0);

    let cappedByRequest = false;
    if (input.requestedAmount && input.requestedAmount > 0 && input.requestedAmount < maxLoan) {
      maxLoan = input.requestedAmount;
      cappedByRequest = true;
    }

    const rawMaxLoan = maxLoan;
    const roundingStep = Number(adminData.loanRoundingStep || 0);
    if (roundingStep > 0) {
      maxLoan = Math.floor(maxLoan / roundingStep) * roundingStep;
    }
    if (maxLoan <= 0 && rawMaxLoan > 0) {
      return {
        bank, ineligible: true,
        reason: `Eligible amount (approx. ${fmt(rawMaxLoan)}) falls below ${bank.name}'s minimum sanction increment of ${fmt(roundingStep)} once rounded to standard multiples.`,
        variantLabel: opts.variantLabel, variantKey: opts.variantKey,
      };
    }

    if (opts.loanAmountMin && maxLoan < Number(opts.loanAmountMin)) {
      return {
        bank, ineligible: true,
        reason: `This product's minimum loan amount is ${fmt(opts.loanAmountMin)}, above what you're eligible for.`,
        shortReason: '❌ Below Minimum Loan Size', variantLabel: opts.variantLabel, variantKey: opts.variantKey,
      };
    }
    if (opts.loanAmountMax && maxLoan > Number(opts.loanAmountMax)) {
      maxLoan = Number(opts.loanAmountMax);
    }

    const emi = isFlatRate ? emiFromPrincipalFlat(maxLoan, rate, months) : emiFromPrincipal(maxLoan, rate, months);
    const docChargeMin = opts.docChargeMinOverride != null && opts.docChargeMinOverride !== '' ? Number(opts.docChargeMinOverride) : bank.docChargeMin;
    const docChargeMax = opts.docChargeMaxOverride != null && opts.docChargeMaxOverride !== '' ? Number(opts.docChargeMaxOverride) : bank.docChargeCap;
    const docCharge = docChargeBasis === 'fixed'
      ? clamp(Number(opts.docChargeValue || 0), docChargeMin, docChargeMax)
      : clamp(maxLoan * (docChargePct / 100), docChargeMin, docChargeMax);
    const legalFee = getLegalFee(input);
    const totalRepayment = emi * months;
    const totalInterest = totalRepayment - maxLoan;
    const totalCostOfCredit = totalInterest + docCharge;
    const totalOutlay = maxLoan + totalInterest + docCharge;
    const emiPlus1 = isFlatRate ? emiFromPrincipalFlat(maxLoan, rate + 1, months) : emiFromPrincipal(maxLoan, rate + 1, months);
    const emiPlus2 = isFlatRate ? emiFromPrincipalFlat(maxLoan, rate + 2, months) : emiFromPrincipal(maxLoan, rate + 2, months);

    const netCashInHand = input.settleExistingLoans ? maxLoan - Number(input.existingLoanBalance || 0) : null;

    return {
      bank, ineligible: false, rate, rateType, benchmark, rateOptions, termYears, termCapReason, months, schemeApplied: opts.schemeApplied,
      maxLoan, emi, docCharge, legalFee, totalRepayment, isFlatRate,
      totalInterest, totalCostOfCredit, totalOutlay,
      cappedByAsset, cappedByRequest, emiPlus1, emiPlus2, netCashInHand,
      downPayment: assetCap ? assetCap.downPayment : 0,
      remarks: opts.remarksList || [], variantLabel: opts.variantLabel, variantKey: opts.variantKey,
      promotional: !!opts.promotional,
      isPreferredEmployer: !!opts.isPreferredEmployer,
      productId: opts.productDbId ?? null,
      productName: opts.productName ?? null,
      guarantorRequired: opts.guarantorRequired ?? null,
      collateralRequired: opts.collateralRequired ?? null,
      ratesEffectiveDate: opts.ratesEffectiveDate ?? bank.ratesEffectiveDate ?? null,
    };
  }

  const sectorLabels = { government: 'Government', semi_government: 'Semi-Government', private: 'Private Sector', self_employed: 'Self-Employed' };
  const targetLabels = Object.fromEntries(adminData.occupations.map((o) => [o.id, o.label]));
  const occObj = adminData.occupations.find((o) => o.id === input.occupation);
  const occLabel = occObj ? occObj.label : 'Professional';

  let results = [];

  function getBankProducts(bank) {
    const list = [];
    const real = (bank.products || []).filter((p) => p.id !== 'general' && p.isActive !== false && p.status !== 'suspended' && (!p.category || p.category === cat));
    const hasUnrestrictedProduct = real.some((p) =>
      p.commonLoan || ((p.targetOccupation === 'all' || !p.targetOccupation?.length) && !p.eligibleSector && (p.targetGender || 'all') === 'all'));
    if (!hasUnrestrictedProduct) list.push({
      id: 'general', name: `Standard ${LOAN_LABELS[cat]}`, status: 'active', termCat: cat,
      rate: bank.baseRate, docChargePct: null, maxTermYears: null,
      dtiOverride: null, otherIncomePct: 0,
      targetOccupation: dualSchemeMode ? 'all' : bank.targetOccupation || 'all',
      targetGender: 'all',
      remarks: bank.remarks,
    });

    if (real.length) {
      real.forEach((p) => list.push(p));
    } else if (dualSchemeMode) {
      const matchesTargetOcc = !bank.targetOccupation || bank.targetOccupation === 'all' || bank.targetOccupation === input.occupation;
      if (matchesTargetOcc) {
        const hasExplicitRate = bank.specialRate != null && bank.specialRate !== '';
        list.push({
          id: 'special', name: `${occLabel} Special Scheme`, status: 'active', termCat: 'professional',
          rate: hasExplicitRate ? bank.specialRate : bank.baseRate,
          docChargePct: bank.specialDocChargePct, maxTermYears: bank.specialMaxTermYears,
          dtiOverride: null, otherIncomePct: 0,
          targetOccupation: bank.targetOccupation || 'all', targetGender: 'all',
          remarks: bank.specialSchemeRemarks,
        });
      }
    }
    return list;
  }

  adminData.banks.filter((b) => b.active).forEach((bank) => {
    if (bank.allowedSectors && !bank.allowedSectors.includes(input.sector)) {
      const allowedLabel = bank.allowedSectors.map((s) => sectorLabels[s] || s).join(' / ');
      const shortSectorLabels = { government: 'Govt', semi_government: 'Semi-Govt', private: 'Private', self_employed: 'Self-Employed' };
      const shortAllowedLabel = bank.allowedSectors.map((s) => shortSectorLabels[s] || s).join('/');
      results.push({ bank, ineligible: true, reason: `Restricted to ${allowedLabel} sector applicants only.`, shortReason: `❌ Restricted to ${shortAllowedLabel} Sector`, variantLabel: null, variantKey: bank.id });
      return;
    }

    const products = getBankProducts(bank).filter((p) => p.status !== 'suspended' && (!p.category || p.category === cat));
    // Why each filtered-out product didn't apply; shown as one greyed row if the bank ends up with no offer at all.
    const skipped = [];
    const resultsBefore = results.length;
    products.forEach((product) => {
      let isPreferredEmployer = false;
      if (product.companiesListRequired) {
        const list = getCompanyList(adminData, product.companiesListId);
        const employer = (input.employerName || '').trim().toLowerCase();
        isPreferredEmployer = !!(employer && list && list.some((c) => c.name.trim().toLowerCase() === employer));
      }

      if (!product.commonLoan) {
        const targetOccList = Array.isArray(product.targetOccupation) ? product.targetOccupation : [product.targetOccupation];
        const occMismatch = product.targetOccupation && !targetOccList.includes('all') && !targetOccList.includes(input.occupation);
        if (occMismatch) {
          const occLabelStr = targetOccList.map((id) => targetLabels[id] || id).join(' or ');
          skipped.push({ bank, ineligible: true, reason: `Restricted to ${occLabelStr} only.`, shortReason: `❌ ${occLabelStr} Only`, variantLabel: null, variantKey: bank.id });
          return;
        }
        if (product.eligibleSector && product.eligibleSector !== input.sector) {
          const label = sectorLabels[product.eligibleSector] || product.eligibleSector;
          skipped.push({ bank, ineligible: true, reason: `Restricted to ${label} sector applicants only.`, shortReason: `❌ ${label} Sector Only`, variantLabel: null, variantKey: bank.id });
          return;
        }
        if (product.targetGender && product.targetGender !== 'all') {
          if (!input.applicant?.gender || input.applicant.gender !== product.targetGender) return;
        }
        if (product.minEmploymentMonths > 0 && input.employmentMonths != null && input.employmentMonths < product.minEmploymentMonths) {
          skipped.push({ bank, ineligible: true, reason: `Requires at least ${product.minEmploymentMonths} months in your current job (you entered ${input.employmentMonths}).`, shortReason: '❌ Employment Period Too Short', variantLabel: null, variantKey: bank.id });
          return;
        }
      }
      // Applies to common loans too. A high enough qualifying income stands in for being on the list.
      if (product.companiesListRequired && !isPreferredEmployer) {
        const threshold = adminData.unapprovedEmployerSalaryOverrideThreshold;
        if (threshold == null || computeQualifyingIncome(input, product) < threshold) {
          const reason = threshold == null
            ? 'This product is restricted to employees of approved companies — add your employer name in Step 2 to check.'
            : `Requires an employer on the bank's approved list, or a net monthly salary of at least ${fmt(threshold)}.`;
          skipped.push({ bank, ineligible: true, reason, shortReason: '❌ Employer Not On Approved List', variantLabel: null, variantKey: bank.id });
          return;
        }
      }
      results.push(evaluateVariant(bank, product.termCat || cat, {
        rateOverride: product.rate,
        termCapOverride: product.maxTermYears,
        dtiOverride: product.dtiOverride,
        otherIncomePct: product.otherIncomePct,
        otIncluded: product.otIncluded,
        remarksList: product.remarks,
        variantLabel: product.name || null,
        variantKey: bank.id + '__' + product.id,
        schemeApplied: product.id === 'special' || (Array.isArray(product.targetOccupation) && product.targetOccupation.includes(input.occupation)),
        promotional: product.status === 'promotional',
        ageMin: product.ageMin,
        ageMaxAtMaturity: product.ageMaxAtMaturity,
        minNetMonthlyIncome: product.minNetMonthlyIncome,
        loanAmountMin: product.loanAmountMin,
        loanAmountMax: product.loanAmountMax,
        docChargeBasis: product.docChargeBasis,
        docChargeValue: product.docChargeValue,
        docChargeMinOverride: product.docChargeMin,
        docChargeMaxOverride: product.docChargeMax,
        interestRateType: product.interestRateType,
        interestRateTiers: product.interestRateTiers,
        benchmarkCode: product.benchmarkCode,
        productDbId: product.dbId,
        productName: product.name,
        guarantorRequired: product.guarantorRequired,
        ratesEffectiveDate: product.ratesEffectiveDate,
        collateralRequired: product.collateralRequired,
        isPreferredEmployer,
      }));
    });
    if (results.length === resultsBefore && skipped.length) results.push(skipped[0]);
  });

  const eligible = results.filter((r) => !r.ineligible).sort((a, b) => a.totalCostOfCredit - b.totalCostOfCredit);
  const ineligible = results.filter((r) => r.ineligible);

  return {
    results: [...eligible, ...ineligible],
    emiCapacity,
    obligationsFreedUp: input.settleExistingLoans ? Number(input.existingObligations || 0) : 0,
    dtiPctUsed: dtiPct,
    ageCapYears,
    dualSchemeMode,
  };
}

export function getMaxTermAcrossBanks(banks, loanCategory) {
  const cat = loanCategory || 'personal';
  const caps = banks.filter((b) => b.active).map((b) => b.maxTermYears[cat] || 0);
  return Math.max(...caps, 1);
}
