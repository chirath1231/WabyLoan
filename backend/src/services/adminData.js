// Reads the normalized bank/product/lookup tables (see db/schema.sql) and reshapes them into the
// camelCase JS objects the eligibility engine and the admin console work with. Lookup foreign keys
// are resolved to their `code` here, so everything above this layer deals in codes ('personal',
// 'government', 'fixed', ...) rather than surrogate ids.
import { pool } from '../db/pool.js';

const num = (v) => (v != null ? Number(v) : null);

function groupBy(rows, key) {
  const map = new Map();
  for (const row of rows) {
    if (!map.has(row[key])) map.set(row[key], []);
    map.get(row[key]).push(row);
  }
  return map;
}

const PRODUCT_SELECT = `
  select p.*,
    cat.code as category_code, st.code as status_code, irt.code as interest_rate_type_code,
    bm.code as benchmark_code, sec.code as eligible_sector_code, dcb.code as doc_charge_basis_code,
    gt.code as guarantor_code, ct.code as collateral_code, it.code as insurance_code,
    cur.code as currency_code, g.code as target_gender_code
  from loan_products p
  join master_loan_categories cat on cat.loan_category_id = p.loan_category_id
  join master_product_statuses st on st.product_status_id = p.product_status_id
  join master_interest_rate_types irt on irt.interest_rate_type_id = p.interest_rate_type_id
  left join master_benchmark_rates bm on bm.benchmark_rate_id = p.benchmark_rate_id
  left join master_sectors sec on sec.sector_id = p.eligible_sector_id
  join master_doc_charge_basis dcb on dcb.doc_charge_basis_id = p.doc_charge_basis_id
  join master_guarantor_terms gt on gt.guarantor_term_id = p.guarantor_term_id
  join master_collateral_types ct on ct.collateral_type_id = p.collateral_type_id
  join master_insurance_types it on it.insurance_type_id = p.insurance_type_id
  join master_currencies cur on cur.currency_id = p.currency_id
  join master_genders g on g.gender_id = p.target_gender_id
  where not p.is_deleted`;

function mapProductRow(row, children) {
  const targetOccupations = (children.occupations.get(row.product_id) || []).map((o) => o.code);
  return {
    id: row.product_code, // engine identity ('general' is synthesized by the engine itself)
    dbId: row.product_id,
    bankId: row.bank_id,
    code: row.product_code,
    name: row.name,
    category: row.category_code,
    status: row.status_code,
    isActive: row.is_active,
    interestRateType: row.interest_rate_type_code,
    benchmarkCode: row.benchmark_code,
    interestRateTiers: (children.tiers.get(row.product_id) || []).map((t) => ({
      id: t.product_interest_rate_tier_id,
      rateTypeCode: t.rate_type_code,
      fixedRateValue: num(t.fixed_rate_value),
      minTermYears: t.min_term_years,
      maxTermYears: t.max_term_years,
      marginOverAwplr: num(t.margin_over_awplr),
      floorRate: num(t.floor_rate),
    })),
    docChargeBasis: row.doc_charge_basis_code,
    docChargeValue: num(row.doc_charge_value),
    docChargeMin: num(row.doc_charge_min),
    docChargeMax: num(row.doc_charge_max),
    maxTermYears: row.max_term_years,
    dtiOverride: num(row.dti_override),
    otIncluded: row.ot_included,
    otPct: Number(row.ot_pct),
    otherIncomeIncluded: row.other_income_included,
    otherIncomePct: row.other_income_included ? Number(row.other_income_pct) : 0,
    loanAmountMin: Number(row.loan_amount_min),
    loanAmountMax: num(row.loan_amount_max),
    minNetMonthlyIncome: Number(row.min_net_monthly_income),
    eligibleSector: row.eligible_sector_code,
    targetOccupation: targetOccupations.length ? targetOccupations : 'all',
    targetGender: row.target_gender_code,
    commonLoan: row.common_loan,
    companiesListRequired: row.companies_list_required,
    companiesListId: row.companies_list_id,
    ageMin: row.age_min,
    ageMaxAtMaturity: row.age_max_at_maturity,
    minEmploymentMonths: row.min_employment_months,
    guarantorRequired: row.guarantor_code,
    collateralRequired: row.collateral_code,
    insuranceRequired: row.insurance_code,
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
    currency: row.currency_code,
    ratesEffectiveDate: row.rates_effective_date,
    remarks: (children.remarks.get(row.product_id) || []).map((r) => r.remark_text),
  };
}

async function loadProductChildren(productIds) {
  if (!productIds.length) return { tiers: new Map(), remarks: new Map(), occupations: new Map() };
  const [tiers, remarks, occupations] = await Promise.all([
    pool.query(
      `select * from product_interest_rate_tiers where is_active and product_id = any($1)
       order by rate_type_code, min_term_years`,
      [productIds]
    ),
    pool.query('select * from product_remarks where product_id = any($1) order by sort_order, product_remark_id', [productIds]),
    pool.query(
      `select pto.product_id, o.code from product_target_occupations pto
       join master_occupations o on o.occupation_id = pto.occupation_id
       where pto.product_id = any($1)`,
      [productIds]
    ),
  ]);
  return {
    tiers: groupBy(tiers.rows, 'product_id'),
    remarks: groupBy(remarks.rows, 'product_id'),
    occupations: groupBy(occupations.rows, 'product_id'),
  };
}

export async function getProducts({ bankId } = {}) {
  const result = await pool.query(
    `${PRODUCT_SELECT} ${bankId != null ? 'and p.bank_id = $1' : ''} order by p.bank_id, cat.sort_order, p.product_id`,
    bankId != null ? [bankId] : []
  );
  const children = await loadProductChildren(result.rows.map((r) => r.product_id));
  return result.rows.map((r) => mapProductRow(r, children));
}

function mapBankRow(row, children, products) {
  const maxTermYears = {};
  for (const t of children.terms.get(row.bank_id) || []) maxTermYears[t.code] = t.max_term_years;
  return {
    id: row.bank_id,
    code: row.bank_code,
    name: row.name,
    short: row.short_name,
    type: row.bank_type_code,
    active: row.active,
    sponsored: row.sponsored,
    logoUrl: row.logo_url,
    websiteUrl: row.website_url,
    email: row.email,
    hotline: row.hotline,
    phone: row.phone,
    whatsapp: row.whatsapp,
    address: row.address,
    branchLocatorUrl: row.branch_locator_url,
    color: row.brand_color,
    baseRate: Number(row.base_rate),
    docChargePct: Number(row.doc_charge_pct),
    docChargeMin: Number(row.doc_charge_min),
    docChargeCap: Number(row.doc_charge_cap),
    ratesEffectiveDate: row.rates_effective_date,
    maxTermYears,
    allowedSectors: (children.sectors.get(row.bank_id) || []).map((s) => s.code),
    remarks: (children.remarks.get(row.bank_id) || []).map((r) => r.remark_text),
    updatedAt: row.updated_at || row.created_at,
    products,
  };
}

async function queryBanks(where = '', params = []) {
  const banks = await pool.query(
    `select b.*, t.code as bank_type_code from banks b
     join master_bank_types t on t.bank_type_id = b.bank_type_id
     where not b.is_deleted ${where} order by b.name asc`,
    params
  );
  const ids = banks.rows.map((b) => b.bank_id);
  const [terms, sectors, remarks] = await Promise.all([
    pool.query(
      `select bt.bank_id, c.code, bt.max_term_years from bank_max_terms_by_category bt
       join master_loan_categories c on c.loan_category_id = bt.loan_category_id where bt.bank_id = any($1)`,
      [ids]
    ),
    pool.query(
      `select bs.bank_id, s.code from bank_allowed_sectors bs
       join master_sectors s on s.sector_id = bs.sector_id where bs.bank_id = any($1) order by s.sort_order`,
      [ids]
    ),
    pool.query('select * from bank_remarks where bank_id = any($1) order by sort_order, bank_remark_id', [ids]),
  ]);
  return {
    rows: banks.rows,
    children: {
      terms: groupBy(terms.rows, 'bank_id'),
      sectors: groupBy(sectors.rows, 'bank_id'),
      remarks: groupBy(remarks.rows, 'bank_id'),
    },
  };
}

export async function getAllBanksWithProducts() {
  const [{ rows, children }, products] = await Promise.all([queryBanks(), getProducts()]);
  const productsByBank = groupBy(products, 'bankId');
  return rows.map((b) => mapBankRow(b, children, productsByBank.get(b.bank_id) || []));
}

export async function getBankWithProducts(bankId) {
  const { rows, children } = await queryBanks('and b.bank_id = $1', [bankId]);
  if (!rows[0]) return null;
  return mapBankRow(rows[0], children, await getProducts({ bankId }));
}

export async function getOccupations() {
  const result = await pool.query(
    'select * from master_occupations where not is_deleted and is_active order by sort_order, label'
  );
  return result.rows.map((r) => ({ id: r.code, dbId: r.occupation_id, label: r.label, special: r.is_special_scheme, sortOrder: r.sort_order }));
}

export async function getSectors() {
  const result = await pool.query(
    `select s.*, d.max_dti_percent from master_sectors s
     left join sector_dti_rates d on d.sector_id = s.sector_id
     where not s.is_deleted and s.is_active order by s.sort_order`
  );
  return result.rows.map((r) => ({ id: r.code, dbId: r.sector_id, label: r.label, maxDtiPercent: num(r.max_dti_percent) }));
}

export async function getLoanCategories() {
  const result = await pool.query('select * from master_loan_categories where is_active order by sort_order');
  return result.rows.map((r) => ({
    id: r.code,
    dbId: r.loan_category_id,
    label: r.label,
    description: r.description,
    iconClass: r.icon_class,
    formProfile: r.form_profile,
    enabled: r.is_enabled,
  }));
}

export async function getBenchmarkRates() {
  const result = await pool.query('select * from master_benchmark_rates order by sort_order');
  return result.rows.map((r) => ({
    code: r.code,
    label: r.label,
    rate: num(r.rate_value),
    asOfDate: r.as_of_date,
    confirmed: r.is_confirmed,
    active: r.is_active,
  }));
}

// { sectorCode: { occupationCode: { otAllowed, otherIncomeAllowed } } }
export async function getIncomePolicies() {
  const result = await pool.query(
    `select s.code as sector, o.code as occupation, p.ot_allowed, p.other_income_allowed
     from sector_occupation_income_policies p
     join master_sectors s on s.sector_id = p.sector_id
     join master_occupations o on o.occupation_id = p.occupation_id`
  );
  const policies = {};
  for (const r of result.rows) {
    (policies[r.sector] ||= {})[r.occupation] = { otAllowed: r.ot_allowed, otherIncomeAllowed: r.other_income_allowed };
  }
  return policies;
}

// Every lookup table the admin console's selects need, keyed by table.
export async function getLookups() {
  const tables = {
    bankTypes: ['master_bank_types', 'bank_type_id'],
    collateralTypes: ['master_collateral_types', 'collateral_type_id'],
    currencies: ['master_currencies', 'currency_id'],
    docChargeBasis: ['master_doc_charge_basis', 'doc_charge_basis_id'],
    genders: ['master_genders', 'gender_id'],
    guarantorTerms: ['master_guarantor_terms', 'guarantor_term_id'],
    insuranceTypes: ['master_insurance_types', 'insurance_type_id'],
    interestRateTypes: ['master_interest_rate_types', 'interest_rate_type_id'],
    leadStatuses: ['master_lead_statuses', 'sort_order'],
    productStatuses: ['master_product_statuses', 'product_status_id'],
    roles: ['master_roles', 'role_id'],
  };
  const entries = await Promise.all(
    Object.entries(tables).map(async ([key, [table, order]]) => {
      const result = await pool.query(`select code, label from ${table} where is_active order by ${order}`);
      return [key, result.rows.map((r) => ({ id: r.code, label: r.label }))];
    })
  );
  return Object.fromEntries(entries);
}

export async function getCompanyListsWithEntries() {
  const lists = await pool.query('select * from company_lists where not is_deleted order by list_name asc');
  const entries = await pool.query('select * from company_entries where not is_deleted order by company_name');
  const entriesByList = groupBy(entries.rows, 'list_id');
  return lists.rows.map((l) => ({
    id: l.list_id,
    bankId: l.bank_id,
    name: l.list_name,
    entries: (entriesByList.get(l.list_id) || []).map((e) => ({ id: e.entry_id, name: e.company_name, sector: e.sector })),
  }));
}

export async function getSystemSettings() {
  const result = await pool.query('select setting_key, setting_value, data_type from system_settings');
  const settings = {};
  for (const r of result.rows) {
    settings[r.setting_key] = r.data_type === 'string' ? r.setting_value
      : r.data_type === 'bit' ? r.setting_value === '1'
      : Number(r.setting_value);
  }
  return settings;
}

export async function getAdminSettings() {
  const [sectors, system, categories] = await Promise.all([getSectors(), getSystemSettings(), getLoanCategories()]);
  const dti = {};
  for (const s of sectors) dti[s.id] = s.maxDtiPercent ?? 60;
  return {
    dti,
    businessLoanEnabled: !!categories.find((c) => c.id === 'business')?.enabled,
    loanRoundingStep: system.LoanRoundingStep ?? 0,
    pensionMaxAge: system.PensionMaxAge ?? 80,
    defaultRetirementAge: system.DefaultRetirementAge ?? 60,
    defaultBenchmarkCode: system.DefaultBenchmarkCode || 'MONTHLY',
    offerGatingEnabled: !!system.FeatureFlag_OfferGatingEnabled,
    unapprovedEmployerSalaryOverrideThreshold: system.UnapprovedEmployerSalaryOverrideThreshold ?? null,
  };
}

// Assembles everything the eligibility engine needs in one call.
export async function loadEngineAdminData() {
  const [banks, occupations, companyLists, settings, benchmarks, incomePolicies] = await Promise.all([
    getAllBanksWithProducts(),
    getOccupations(),
    getCompanyListsWithEntries(),
    getAdminSettings(),
    getBenchmarkRates(),
    getIncomePolicies(),
  ]);
  return {
    banks,
    occupations,
    companyLists,
    dti: settings.dti,
    loanRoundingStep: settings.loanRoundingStep,
    pensionMaxAge: settings.pensionMaxAge,
    businessLoanEnabled: settings.businessLoanEnabled,
    benchmarks,
    defaultBenchmarkCode: settings.defaultBenchmarkCode,
    unapprovedEmployerSalaryOverrideThreshold: settings.unapprovedEmployerSalaryOverrideThreshold,
    incomePolicies,
  };
}
