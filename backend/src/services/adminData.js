// Reads bank/product/occupation/company-list/settings data from Postgres and
// reshapes it into the exact camelCase JS shape the (ported) eligibility engine
// expects — see eligibilityEngine.js and the original prototype's `state.admin`.
import { pool } from '../db/pool.js';

function mapProductRow(row) {
  return {
    id: row.slug, // engine identity ('general' synthesized elsewhere, real products use their seed slug)
    dbId: row.id, // real uuid, for referencing from applications/leads
    bankId: row.bank_id,
    name: row.name,
    category: row.category,
    status: row.status,
    rate: Number(row.rate),
    interestRateType: row.interest_rate_type,
    docChargeBasis: row.doc_charge_basis,
    docChargeValue: Number(row.doc_charge_value),
    docChargeMin: row.doc_charge_min != null ? Number(row.doc_charge_min) : null,
    docChargeMax: row.doc_charge_max != null ? Number(row.doc_charge_max) : null,
    maxTermYears: row.max_term_years,
    dtiOverride: row.dti_override != null ? Number(row.dti_override) : null,
    otIncluded: row.ot_included,
    otherIncomePct: Number(row.other_income_pct),
    loanAmountMin: Number(row.loan_amount_min),
    loanAmountMax: Number(row.loan_amount_max),
    minNetMonthlyIncome: Number(row.min_net_monthly_income),
    targetOccupation: row.target_occupation,
    targetGender: row.target_gender,
    commonLoan: row.common_loan,
    companiesListRequired: row.companies_list_required,
    companiesListId: row.companies_list_id,
    ageMin: row.age_min,
    ageMaxAtMaturity: row.age_max_at_maturity,
    minEmploymentMonths: row.min_employment_months,
    guarantorRequired: row.guarantor_required,
    collateralRequired: row.collateral_required,
    insuranceRequired: row.insurance_required,
    balloonAllowed: row.balloon_allowed,
    balloonPct: Number(row.balloon_pct),
    earlySettlementAllowed: row.early_settlement_allowed,
    earlySettlementChargePct: Number(row.early_settlement_charge_pct),
    latePaymentPenaltyPct: Number(row.late_payment_penalty_pct),
    gracePeriodDays: row.grace_period_days,
    processingDays: row.processing_days,
    cribCheckRequired: row.crib_check_required,
    salaryCreditRequired: row.salary_credit_required,
    coApplicantAllowed: row.co_applicant_allowed,
    topUpAfterMonths: row.top_up_after_months,
    currency: row.currency,
    remarks: row.remarks || [],
  };
}

function mapBankRow(row, products) {
  return {
    id: row.id,
    name: row.name,
    short: row.short,
    type: row.type,
    active: row.active,
    sponsored: row.sponsored,
    baseRate: Number(row.base_rate),
    maxTermYears: row.max_term_years,
    docChargePct: row.doc_charge_pct != null ? Number(row.doc_charge_pct) : null,
    docChargeMin: row.doc_charge_min != null ? Number(row.doc_charge_min) : null,
    docChargeCap: row.doc_charge_cap != null ? Number(row.doc_charge_cap) : null,
    color: row.color,
    allowedSectors: row.allowed_sectors || [],
    targetOccupation: row.target_occupation,
    remarks: row.remarks || [],
    specialSchemeRemarks: row.special_scheme_remarks || [],
    specialRate: row.special_rate != null ? Number(row.special_rate) : null,
    specialDocChargePct: row.special_doc_charge_pct != null ? Number(row.special_doc_charge_pct) : null,
    specialMaxTermYears: row.special_max_term_years,
    updatedAt: row.updated_at,
    products: products.map(mapProductRow),
  };
}

export async function getAllBanksWithProducts() {
  const banksResult = await pool.query('select * from banks order by name asc');
  const productsResult = await pool.query('select * from products order by created_at asc');
  const productsByBank = new Map();
  for (const p of productsResult.rows) {
    if (!productsByBank.has(p.bank_id)) productsByBank.set(p.bank_id, []);
    productsByBank.get(p.bank_id).push(p);
  }
  return banksResult.rows.map((b) => mapBankRow(b, productsByBank.get(b.id) || []));
}

export async function getBankWithProducts(bankId) {
  const bankResult = await pool.query('select * from banks where id = $1', [bankId]);
  if (!bankResult.rows[0]) return null;
  const productsResult = await pool.query('select * from products where bank_id = $1 order by created_at asc', [bankId]);
  return mapBankRow(bankResult.rows[0], productsResult.rows);
}

export async function getOccupations() {
  const result = await pool.query('select * from occupations order by label asc');
  return result.rows.map((r) => ({ id: r.id, label: r.label, special: r.special }));
}

export async function getCompanyListsWithEntries() {
  const listsResult = await pool.query('select * from company_lists order by name asc');
  const entriesResult = await pool.query('select * from company_list_entries');
  const entriesByList = new Map();
  for (const e of entriesResult.rows) {
    if (!entriesByList.has(e.list_id)) entriesByList.set(e.list_id, []);
    entriesByList.get(e.list_id).push({ name: e.name, tier: e.tier, sector: e.sector });
  }
  return listsResult.rows.map((l) => ({
    id: l.id,
    bankId: l.bank_id,
    name: l.name,
    entries: entriesByList.get(l.id) || [],
  }));
}

export async function getAdminSettings() {
  const result = await pool.query('select * from admin_settings where id = true');
  const row = result.rows[0];
  return {
    dti: {
      government: Number(row.dti_government),
      semi_government: Number(row.dti_semi_government),
      private: Number(row.dti_private),
      self_employed: Number(row.dti_self_employed),
    },
    businessLoanEnabled: row.business_loan_enabled,
    loanRoundingStep: Number(row.loan_rounding_step),
    pensionMaxAge: row.pension_max_age,
  };
}

// Assembles everything the eligibility engine needs in one call.
export async function loadEngineAdminData() {
  const [banks, occupations, companyLists, settings] = await Promise.all([
    getAllBanksWithProducts(),
    getOccupations(),
    getCompanyListsWithEntries(),
    getAdminSettings(),
  ]);
  return {
    banks,
    occupations,
    companyLists,
    dti: settings.dti,
    loanRoundingStep: settings.loanRoundingStep,
    pensionMaxAge: settings.pensionMaxAge,
    businessLoanEnabled: settings.businessLoanEnabled,
  };
}
