import { Router } from 'express';
import { pool } from '../../db/pool.js';
import { logAudit } from '../../services/auditLog.js';

export const adminLeadsRouter = Router();

adminLeadsRouter.get('/soft', async (req, res) => {
  const result = await pool.query(
    `select l.*, b.name as bank_name from soft_leads l left join banks b on b.id = l.bank_id order by l.created_at desc`
  );
  res.json({ softLeads: result.rows });
});

adminLeadsRouter.get('/applications', async (req, res) => {
  const result = await pool.query(
    `select a.*, u.email as user_email, u.name as user_name, b.name as bank_name, p.name as product_name
     from applications a
     join users u on u.id = a.user_id
     join banks b on b.id = a.bank_id
     left join products p on p.id = a.product_id
     order by a.created_at desc`
  );
  res.json({ applications: result.rows });
});

adminLeadsRouter.put('/applications/:id/status', async (req, res) => {
  const { status } = req.body;
  const allowed = ['new', 'contacted', 'approved', 'rejected', 'closed'];
  if (!allowed.includes(status)) return res.status(400).json({ error: `status must be one of: ${allowed.join(', ')}` });

  const result = await pool.query(
    `update applications set status = $1, updated_at = now() where id = $2 returning *`,
    [status, req.params.id]
  );
  if (!result.rows[0]) return res.status(404).json({ error: 'Application not found.' });
  await logAudit(req.user.email, 'application.statusChange', { applicationId: req.params.id, status });
  res.json({ application: result.rows[0] });
});
