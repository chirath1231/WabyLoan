import { Router } from 'express';
import { pool } from '../../db/pool.js';
import { getAllBanksWithProducts, getBankWithProducts, getProducts } from '../../services/adminData.js';
import { buildInsert, buildUpdate } from '../../utils/sqlCrud.js';
import { logAudit } from '../../services/auditLog.js';

export const adminBanksRouter = Router();

const BANK_FIELDS = {
  code: { column: 'bank_code' },
  name: { column: 'name' },
  short: { column: 'short_name' },
  type: { column: 'bank_type_id', lookup: 'master_bank_types' },
  active: { column: 'active' },
  sponsored: { column: 'sponsored' },
  logoUrl: { column: 'logo_url' },
  websiteUrl: { column: 'website_url' },
  email: { column: 'email' },
  hotline: { column: 'hotline' },
  phone: { column: 'phone' },
  whatsapp: { column: 'whatsapp' },
  address: { column: 'address' },
  branchLocatorUrl: { column: 'branch_locator_url' },
  color: { column: 'brand_color' },
  baseRate: { column: 'base_rate' },
  docChargePct: { column: 'doc_charge_pct' },
  docChargeMin: { column: 'doc_charge_min' },
  docChargeCap: { column: 'doc_charge_cap' },
  ratesEffectiveDate: { column: 'rates_effective_date' },
};

const PRODUCT_FIELDS = {
  code: { column: 'product_code' },
  name: { column: 'name' },
  category: { column: 'loan_category_id', lookup: 'master_loan_categories' },
  status: { column: 'product_status_id', lookup: 'master_product_statuses' },
  isActive: { column: 'is_active' },
  interestRateType: { column: 'interest_rate_type_id', lookup: 'master_interest_rate_types' },
  benchmarkCode: { column: 'benchmark_rate_id', lookup: 'master_benchmark_rates' },
  docChargeBasis: { column: 'doc_charge_basis_id', lookup: 'master_doc_charge_basis' },
  docChargeValue: { column: 'doc_charge_value' },
  docChargeMin: { column: 'doc_charge_min' },
  docChargeMax: { column: 'doc_charge_max' },
  maxTermYears: { column: 'max_term_years' },
  dtiOverride: { column: 'dti_override' },
  otIncluded: { column: 'ot_included' },
  otPct: { column: 'ot_pct' },
  otherIncomeIncluded: { column: 'other_income_included' },
  otherIncomePct: { column: 'other_income_pct' },
  loanAmountMin: { column: 'loan_amount_min' },
  loanAmountMax: { column: 'loan_amount_max' },
  minNetMonthlyIncome: { column: 'min_net_monthly_income' },
  eligibleSector: { column: 'eligible_sector_id', lookup: 'master_sectors', lookupId: 'sector_id' },
  targetGender: { column: 'target_gender_id', lookup: 'master_genders', lookupId: 'gender_id' },
  commonLoan: { column: 'common_loan' },
  companiesListRequired: { column: 'companies_list_required' },
  companiesListId: { column: 'companies_list_id' },
  ageMin: { column: 'age_min' },
  ageMaxAtMaturity: { column: 'age_max_at_maturity' },
  minEmploymentMonths: { column: 'min_employment_months' },
  guarantorRequired: { column: 'guarantor_term_id', lookup: 'master_guarantor_terms' },
  collateralRequired: { column: 'collateral_type_id', lookup: 'master_collateral_types' },
  insuranceRequired: { column: 'insurance_type_id', lookup: 'master_insurance_types' },
  balloonAllowed: { column: 'balloon_allowed' },
  balloonPct: { column: 'balloon_pct' },
  earlySettlementAllowed: { column: 'early_settlement_allowed' },
  earlySettlementChargePct: { column: 'early_settlement_charge_pct' },
  latePaymentPenaltyPct: { column: 'late_payment_penalty_pct' },
  gracePeriodDays: { column: 'grace_period_days' },
  processingDays: { column: 'processing_days' },
  cribCheckRequired: { column: 'crib_check_required' },
  salaryCreditRequired: { column: 'salary_credit_required' },
  coApplicantAllowed: { column: 'co_applicant_allowed' },
  topUpAfterMonths: { column: 'top_up_after_months' },
  currency: { column: 'currency_id', lookup: 'master_currencies' },
  ratesEffectiveDate: { column: 'rates_effective_date' },
};

// Defaults for a new product's NOT NULL lookups, so a minimal POST {name, category} works.
const PRODUCT_DEFAULTS = {
  status: 'active', interestRateType: 'fixed', docChargeBasis: 'percent', guarantorRequired: 'no',
  collateralRequired: 'none', insuranceRequired: 'none', currency: 'LKR', targetGender: 'all',
};

async function inTransaction(work) {
  const client = await pool.connect();
  try {
    await client.query('begin');
    const result = await work(client);
    await client.query('commit');
    return result;
  } catch (err) {
    await client.query('rollback');
    throw err;
  } finally {
    client.release();
  }
}

// Replaces the bank's junction/child rows for whichever of these the request includes.
async function saveBankChildren(client, bankId, body) {
  if (body.maxTermYears && typeof body.maxTermYears === 'object') {
    await client.query('delete from bank_max_terms_by_category where bank_id = $1', [bankId]);
    for (const [cat, years] of Object.entries(body.maxTermYears)) {
      if (years === '' || years == null) continue;
      await client.query(
        `insert into bank_max_terms_by_category (bank_id, loan_category_id, max_term_years)
         select $1, loan_category_id, $3 from master_loan_categories where code = $2`,
        [bankId, cat, Number(years)]
      );
    }
  }
  if (Array.isArray(body.allowedSectors)) {
    await client.query('delete from bank_allowed_sectors where bank_id = $1', [bankId]);
    await client.query(
      `insert into bank_allowed_sectors (bank_id, sector_id)
       select $1, sector_id from master_sectors where code = any($2)`,
      [bankId, body.allowedSectors]
    );
  }
  if (Array.isArray(body.remarks)) {
    await client.query('delete from bank_remarks where bank_id = $1', [bankId]);
    for (const [i, text] of body.remarks.filter((r) => r && r.trim()).entries()) {
      await client.query('insert into bank_remarks (bank_id, remark_text, sort_order) values ($1, $2, $3)', [bankId, text.trim(), i]);
    }
  }
}

async function saveProductChildren(client, productId, body) {
  if (Array.isArray(body.interestRateTiers)) {
    await client.query('delete from product_interest_rate_tiers where product_id = $1', [productId]);
    for (const t of body.interestRateTiers) {
      await client.query(
        `insert into product_interest_rate_tiers
           (product_id, rate_type_code, fixed_rate_value, min_term_years, max_term_years, margin_over_awplr, floor_rate)
         values ($1, $2, $3, $4, $5, $6, $7)`,
        [productId, t.rateTypeCode, t.fixedRateValue ?? null, t.minTermYears, t.maxTermYears, t.marginOverAwplr ?? null, t.floorRate ?? null]
      );
    }
  }
  if (Array.isArray(body.remarks)) {
    await client.query('delete from product_remarks where product_id = $1', [productId]);
    for (const [i, text] of body.remarks.filter((r) => r && r.trim()).entries()) {
      await client.query('insert into product_remarks (product_id, remark_text, sort_order) values ($1, $2, $3)', [productId, text.trim(), i]);
    }
  }
  if ('targetOccupation' in body) {
    await client.query('delete from product_target_occupations where product_id = $1', [productId]);
    const codes = Array.isArray(body.targetOccupation) ? body.targetOccupation.filter((c) => c !== 'all') : [];
    if (codes.length) {
      await client.query(
        `insert into product_target_occupations (product_id, occupation_id)
         select $1, occupation_id from master_occupations where code = any($2)`,
        [productId, codes]
      );
    }
  }
}

function tierErrors(tiers) {
  if (!Array.isArray(tiers)) return null;
  for (const t of tiers) {
    if (!['fixed', 'variable'].includes(t.rateTypeCode)) return 'Each rate tier needs a rate type of fixed or variable.';
    if (!(t.minTermYears >= 0) || !(t.maxTermYears >= t.minTermYears)) return 'Each rate tier needs a valid year range.';
    if (t.fixedRateValue == null && t.marginOverAwplr == null) return 'Each rate tier needs a fixed rate or a margin over AWPLR.';
  }
  return null;
}

adminBanksRouter.get('/', async (req, res) => {
  res.json({ banks: await getAllBanksWithProducts() });
});

adminBanksRouter.get('/:bankId', async (req, res) => {
  const bank = await getBankWithProducts(Number(req.params.bankId));
  if (!bank) return res.status(404).json({ error: 'Bank not found.' });
  res.json({ bank });
});

adminBanksRouter.post('/', async (req, res) => {
  const { code, name, short } = req.body;
  if (!code || !name || !short) return res.status(400).json({ error: 'Bank code, name and short name are required.' });
  const body = { type: 'bank', ...req.body };
  const bankId = await inTransaction(async (client) => {
    const { text, values } = buildInsert('banks', BANK_FIELDS, body, { created_by: req.user.email });
    const { rows } = await client.query(text, values);
    await saveBankChildren(client, rows[0].bank_id, body);
    return rows[0].bank_id;
  });
  await logAudit(req.user, 'Added bank', `${name} (${code})`);
  res.status(201).json({ bank: await getBankWithProducts(bankId) });
});

adminBanksRouter.put('/:bankId', async (req, res) => {
  const bankId = Number(req.params.bankId);
  const found = await inTransaction(async (client) => {
    const update = buildUpdate('banks', 'bank_id', bankId, BANK_FIELDS, req.body, req.user.email);
    if (update) {
      const { rows } = await client.query(update.text, update.values);
      if (!rows[0]) return false;
    }
    await saveBankChildren(client, bankId, req.body);
    return true;
  });
  if (!found) return res.status(404).json({ error: 'Bank not found.' });
  const bank = await getBankWithProducts(bankId);
  await logAudit(req.user, 'Edited bank', bank?.name);
  res.json({ bank });
});

// Soft delete, as everywhere in this schema: leads keep pointing at the bank they were about.
adminBanksRouter.delete('/:bankId', async (req, res) => {
  const result = await pool.query(
    `update banks set is_deleted = true, active = false, updated_at = now(), updated_by = $2
     where bank_id = $1 and not is_deleted returning name`,
    [Number(req.params.bankId), req.user.email]
  );
  if (!result.rows[0]) return res.status(404).json({ error: 'Bank not found.' });
  await logAudit(req.user, 'Deleted bank', result.rows[0].name);
  res.status(204).end();
});

adminBanksRouter.post('/:bankId/products', async (req, res) => {
  const bankId = Number(req.params.bankId);
  const code = req.body.code || req.body.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  if (!code || !req.body.category) return res.status(400).json({ error: 'A product name and category are required.' });
  const tierError = tierErrors(req.body.interestRateTiers);
  if (tierError) return res.status(400).json({ error: tierError });

  const body = { ...PRODUCT_DEFAULTS, ...req.body, code };
  const productId = await inTransaction(async (client) => {
    const { text, values } = buildInsert('loan_products', PRODUCT_FIELDS, body, { bank_id: bankId, created_by: req.user.email });
    const { rows } = await client.query(text, values);
    await saveProductChildren(client, rows[0].product_id, body);
    return rows[0].product_id;
  });
  await logAudit(req.user, 'Added loan product', `Product "${req.body.name}" (ID ${productId})`);
  const product = (await getProducts({ bankId })).find((p) => p.dbId === productId);
  res.status(201).json({ product });
});

adminBanksRouter.put('/:bankId/products/:productId', async (req, res) => {
  const bankId = Number(req.params.bankId);
  const productId = Number(req.params.productId);
  const tierError = tierErrors(req.body.interestRateTiers);
  if (tierError) return res.status(400).json({ error: tierError });

  const found = await inTransaction(async (client) => {
    const update = buildUpdate('loan_products', 'product_id', productId, PRODUCT_FIELDS, req.body, req.user.email);
    if (update) {
      const { rows } = await client.query(update.text, update.values);
      if (!rows[0]) return false;
    }
    await saveProductChildren(client, productId, req.body);
    return true;
  });
  if (!found) return res.status(404).json({ error: 'Product not found.' });
  const product = (await getProducts({ bankId })).find((p) => p.dbId === productId);
  await logAudit(req.user, 'Edited loan product', `Product "${product?.name}" (ID ${productId})`);
  res.json({ product });
});

adminBanksRouter.delete('/:bankId/products/:productId', async (req, res) => {
  const result = await pool.query(
    `update loan_products set is_deleted = true, is_active = false, updated_at = now(), updated_by = $2
     where product_id = $1 and not is_deleted returning name`,
    [Number(req.params.productId), req.user.email]
  );
  if (!result.rows[0]) return res.status(404).json({ error: 'Product not found.' });
  await logAudit(req.user, 'Deleted loan product', `Product "${result.rows[0].name}" (ID ${req.params.productId})`);
  res.status(204).end();
});
