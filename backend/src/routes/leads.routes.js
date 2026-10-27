import { Router } from 'express';
import { pool } from '../db/pool.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';

export const leadsRouter = Router();

const SL_PHONE_RE = /^0(7[0-9]|1[1-9])[0-9]{7}$/;

// Both "request a callback" and "Apply Now" land in the one `leads` table (as in the SQL Server
// original), told apart by source_trigger. Lookups are passed as codes and resolved here.
const INSERT_LEAD = `
  insert into leads (
    full_name, phone, email, loan_category_id, sector_id, occupation_id, requested_amount,
    net_monthly_salary, preferred_bank_id, selected_product_id, product_name, rate_snapshot,
    estimated_emi_snapshot, requested_term_years, lead_status_id, source_page, source_trigger,
    user_id, applicant_snapshot, created_by
  ) values (
    $1, $2, $3,
    (select loan_category_id from master_loan_categories where code = $4),
    (select sector_id from master_sectors where code = $5),
    (select occupation_id from master_occupations where code = $6),
    $7, $8, $9, $10, $11, $12, $13, $14,
    (select lead_status_id from master_lead_statuses where code = 'new'),
    $15, $16, $17, $18, $19
  ) returning lead_id as id, created_at`;

// "Request a callback" soft-lead capture (works for both guests and signed-in users).
leadsRouter.post('/soft', optionalAuth, async (req, res) => {
  const { name, phone, category, bankId } = req.body || {};
  if (!name || !name.trim()) return res.status(400).json({ error: 'Name is required.' });
  if (!SL_PHONE_RE.test(phone || '')) return res.status(400).json({ error: 'Enter a valid Sri Lankan mobile number (07XXXXXXXX).' });

  const result = await pool.query(INSERT_LEAD, [
    name.trim(), phone, req.user?.email || null, category || null, null, null, null,
    null, bankId || null, null, null, null,
    null, null, 'results', 'callback',
    req.user?.sub || null, '{}', req.user?.email || 'guest',
  ]);
  res.status(201).json({ lead: result.rows[0] });
});

// "Apply Now" — a real application submission tied to a specific bank offer,
// distinct from the soft "request a callback" capture above.
export const applicationsRouter = Router();

applicationsRouter.post('/', requireAuth, async (req, res) => {
  const { bankId, productId, category, requestedAmount, applicantSnapshot, computedResult } = req.body || {};
  if (!bankId || !category) return res.status(400).json({ error: 'bankId and category are required.' });

  const snap = applicantSnapshot || {};
  const offer = computedResult || {};
  const result = await pool.query(INSERT_LEAD, [
    req.user.name || null, snap.phone || null, req.user.email, category, snap.sector || null, snap.occupation || null,
    requestedAmount || offer.maxLoan || null, snap.netMonthlySalary || null, bankId, productId || null,
    offer.productName || offer.variantLabel || null, offer.rate ?? null, offer.emi ?? null, offer.termYears ?? null,
    'results', 'apply', req.user.sub, JSON.stringify({ applicant: snap, offer }), req.user.email,
  ]);
  res.status(201).json({ application: result.rows[0] });
});

applicationsRouter.get('/mine', requireAuth, async (req, res) => {
  const result = await pool.query(
    `select l.lead_id as id, l.created_at, l.requested_amount, l.product_name, l.rate_snapshot,
            l.estimated_emi_snapshot, l.requested_term_years, c.code as category, s.code as status, s.label as status_label,
            b.name as bank_name, b.short_name as bank_short
     from leads l
     join master_lead_statuses s on s.lead_status_id = l.lead_status_id
     left join master_loan_categories c on c.loan_category_id = l.loan_category_id
     left join banks b on b.bank_id = l.preferred_bank_id
     where l.user_id = $1 and l.source_trigger = 'apply' and not l.is_deleted
     order by l.created_at desc`,
    [req.user.sub]
  );
  res.json({ applications: result.rows });
});
