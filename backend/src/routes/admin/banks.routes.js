import { Router } from 'express';
import { pool } from '../../db/pool.js';
import { getAllBanksWithProducts, getBankWithProducts } from '../../services/adminData.js';
import { buildInsert, buildUpdate } from '../../utils/sqlCrud.js';
import { logAudit } from '../../services/auditLog.js';

export const adminBanksRouter = Router();

const BANK_FIELDS = {
  name: { column: 'name' },
  short: { column: 'short' },
  type: { column: 'type' },
  active: { column: 'active' },
  sponsored: { column: 'sponsored' },
  baseRate: { column: 'base_rate' },
  maxTermYears: { column: 'max_term_years', json: true },
  docChargePct: { column: 'doc_charge_pct' },
  docChargeMin: { column: 'doc_charge_min' },
  docChargeCap: { column: 'doc_charge_cap' },
  color: { column: 'color' },
  allowedSectors: { column: 'allowed_sectors' },
  targetOccupation: { column: 'target_occupation' },
  remarks: { column: 'remarks', json: true },
  specialSchemeRemarks: { column: 'special_scheme_remarks', json: true },
  specialRate: { column: 'special_rate' },
  specialDocChargePct: { column: 'special_doc_charge_pct' },
  specialMaxTermYears: { column: 'special_max_term_years' },
};

const PRODUCT_FIELDS = {
  name: { column: 'name' },
  category: { column: 'category' },
  status: { column: 'status' },
  rate: { column: 'rate' },
  interestRateType: { column: 'interest_rate_type' },
  docChargeBasis: { column: 'doc_charge_basis' },
  docChargeValue: { column: 'doc_charge_value' },
  docChargeMin: { column: 'doc_charge_min' },
  docChargeMax: { column: 'doc_charge_max' },
  maxTermYears: { column: 'max_term_years' },
  dtiOverride: { column: 'dti_override' },
  otIncluded: { column: 'ot_included' },
  otherIncomePct: { column: 'other_income_pct' },
  loanAmountMin: { column: 'loan_amount_min' },
  loanAmountMax: { column: 'loan_amount_max' },
  minNetMonthlyIncome: { column: 'min_net_monthly_income' },
  targetOccupation: { column: 'target_occupation', json: true },
  targetGender: { column: 'target_gender' },
  commonLoan: { column: 'common_loan' },
  companiesListRequired: { column: 'companies_list_required' },
  companiesListId: { column: 'companies_list_id' },
  ageMin: { column: 'age_min' },
  ageMaxAtMaturity: { column: 'age_max_at_maturity' },
  minEmploymentMonths: { column: 'min_employment_months' },
  guarantorRequired: { column: 'guarantor_required' },
  collateralRequired: { column: 'collateral_required' },
  insuranceRequired: { column: 'insurance_required' },
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
  currency: { column: 'currency' },
  remarks: { column: 'remarks', json: true },
};

adminBanksRouter.get('/', async (req, res) => {
  res.json({ banks: await getAllBanksWithProducts() });
});

adminBanksRouter.get('/:bankId', async (req, res) => {
  const bank = await getBankWithProducts(req.params.bankId);
  if (!bank) return res.status(404).json({ error: 'Bank not found.' });
  res.json({ bank });
});

adminBanksRouter.post('/', async (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'A bank id (slug) is required.' });
  const { text, values } = buildInsert('banks', BANK_FIELDS, req.body, { id });
  const result = await pool.query(text, values);
  await logAudit(req.user.email, 'bank.create', { bankId: id });
  res.status(201).json({ bank: result.rows[0] });
});

adminBanksRouter.put('/:bankId', async (req, res) => {
  const update = buildUpdate('banks', 'id', req.params.bankId, BANK_FIELDS, req.body);
  if (!update) return res.status(400).json({ error: 'No fields to update.' });
  const result = await pool.query(update.text, update.values);
  if (!result.rows[0]) return res.status(404).json({ error: 'Bank not found.' });
  await logAudit(req.user.email, 'bank.update', { bankId: req.params.bankId, fields: Object.keys(req.body) });
  res.json({ bank: result.rows[0] });
});

adminBanksRouter.delete('/:bankId', async (req, res) => {
  const result = await pool.query('delete from banks where id = $1 returning id', [req.params.bankId]);
  if (!result.rows[0]) return res.status(404).json({ error: 'Bank not found.' });
  await logAudit(req.user.email, 'bank.delete', { bankId: req.params.bankId });
  res.status(204).end();
});

adminBanksRouter.post('/:bankId/products', async (req, res) => {
  const slug = req.body.slug || req.body.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  if (!slug) return res.status(400).json({ error: 'A product name or slug is required.' });
  const { text, values } = buildInsert('products', PRODUCT_FIELDS, req.body, { bank_id: req.params.bankId, slug });
  const result = await pool.query(text, values);
  await logAudit(req.user.email, 'product.create', { bankId: req.params.bankId, productId: result.rows[0].id, name: req.body.name });
  res.status(201).json({ product: result.rows[0] });
});

adminBanksRouter.put('/:bankId/products/:productId', async (req, res) => {
  const update = buildUpdate('products', 'id', req.params.productId, PRODUCT_FIELDS, req.body);
  if (!update) return res.status(400).json({ error: 'No fields to update.' });
  const result = await pool.query(update.text, update.values);
  if (!result.rows[0]) return res.status(404).json({ error: 'Product not found.' });
  await logAudit(req.user.email, 'product.update', { productId: req.params.productId, fields: Object.keys(req.body) });
  res.json({ product: result.rows[0] });
});

adminBanksRouter.delete('/:bankId/products/:productId', async (req, res) => {
  const result = await pool.query('delete from products where id = $1 returning id', [req.params.productId]);
  if (!result.rows[0]) return res.status(404).json({ error: 'Product not found.' });
  await logAudit(req.user.email, 'product.delete', { productId: req.params.productId });
  res.status(204).end();
});
