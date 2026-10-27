import { Router } from 'express';
import { pool } from '../../db/pool.js';
import { logAudit } from '../../services/auditLog.js';

export const adminLeadsRouter = Router();

const LEAD_SELECT = `
  select l.lead_id as id, l.full_name as name, l.phone, l.email, l.requested_amount, l.product_name,
         l.rate_snapshot, l.estimated_emi_snapshot, l.requested_term_years, l.source_trigger, l.notes, l.created_at,
         c.code as category, c.label as category_label, s.code as status, s.label as status_label,
         b.name as bank_name, a.email as assigned_to
  from leads l
  join master_lead_statuses s on s.lead_status_id = l.lead_status_id
  left join master_loan_categories c on c.loan_category_id = l.loan_category_id
  left join banks b on b.bank_id = l.preferred_bank_id
  left join users a on a.user_id = l.assigned_to_user_id
  where not l.is_deleted`;

adminLeadsRouter.get('/', async (req, res) => {
  const [leads, statuses] = await Promise.all([
    pool.query(`${LEAD_SELECT} order by l.created_at desc limit 500`),
    pool.query('select code as id, label from master_lead_statuses where is_active order by sort_order'),
  ]);
  res.json({ leads: leads.rows, statuses: statuses.rows });
});

adminLeadsRouter.patch('/:id', async (req, res) => {
  const { status, notes } = req.body;
  const result = await pool.query(
    `update leads set
       lead_status_id = coalesce((select lead_status_id from master_lead_statuses where code = $1), lead_status_id),
       notes = coalesce($2, notes), updated_at = now(), updated_by = $4
     where lead_id = $3 and not is_deleted returning lead_id`,
    [status ?? null, notes ?? null, Number(req.params.id), req.user.email]
  );
  if (!result.rows[0]) return res.status(404).json({ error: 'Lead not found.' });
  if (status) await logAudit(req.user, 'Changed lead status', `Lead ${req.params.id} → ${status}`);
  const lead = await pool.query(`${LEAD_SELECT} and l.lead_id = $1`, [Number(req.params.id)]);
  res.json({ lead: lead.rows[0] });
});
