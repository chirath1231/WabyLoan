import { Router } from 'express';
import { pool } from '../db/pool.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';

export const leadsRouter = Router();

const SL_PHONE_RE = /^0(7[0-9]|1[1-9])[0-9]{7}$/;

// "Request a callback" soft-lead capture (works for both guests and signed-in users).
leadsRouter.post('/soft', optionalAuth, async (req, res) => {
  const { name, phone, category, bankId } = req.body || {};
  if (!name || !name.trim()) return res.status(400).json({ error: 'Name is required.' });
  if (!SL_PHONE_RE.test(phone || '')) return res.status(400).json({ error: 'Enter a valid Sri Lankan mobile number (07XXXXXXXX).' });

  const result = await pool.query(
    `insert into soft_leads (name, phone, category, bank_id) values ($1,$2,$3,$4) returning *`,
    [name.trim(), phone, category || null, bankId || null]
  );
  res.status(201).json({ lead: result.rows[0] });
});

// "Apply Now" — a real application submission tied to a specific bank offer,
// distinct from the soft "request a callback" capture above.
export const applicationsRouter = Router();

applicationsRouter.post('/', requireAuth, async (req, res) => {
  const { bankId, productId, category, requestedAmount, applicantSnapshot, computedResult } = req.body || {};
  if (!bankId || !category) return res.status(400).json({ error: 'bankId and category are required.' });

  const result = await pool.query(
    `insert into applications (user_id, bank_id, product_id, category, requested_amount, applicant_snapshot, computed_result)
     values ($1,$2,$3,$4,$5,$6,$7) returning *`,
    [
      req.user.sub, bankId, productId || null, category, requestedAmount || null,
      JSON.stringify(applicantSnapshot || {}), JSON.stringify(computedResult || {}),
    ]
  );
  res.status(201).json({ application: result.rows[0] });
});

applicationsRouter.get('/mine', requireAuth, async (req, res) => {
  const result = await pool.query(
    `select a.*, b.name as bank_name, b.short as bank_short
     from applications a join banks b on b.id = a.bank_id
     where a.user_id = $1 order by a.created_at desc`,
    [req.user.sub]
  );
  res.json({ applications: result.rows });
});
