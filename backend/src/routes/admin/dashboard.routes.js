import { Router } from 'express';
import { pool } from '../../db/pool.js';

export const adminDashboardRouter = Router();

adminDashboardRouter.get('/', async (req, res) => {
  const { rows } = await pool.query(`
    select
      (select count(*)::int from banks where not is_deleted) as "bankCount",
      (select count(*)::int from loan_products p join banks b using (bank_id) where not p.is_deleted and not b.is_deleted) as "productCount",
      (select count(*)::int from company_lists where not is_deleted) as "companyListCount",
      (select count(*)::int from leads where not is_deleted) as "leadCount",
      (select count(*)::int from leads l join master_lead_statuses s using (lead_status_id) where s.code = 'new' and not l.is_deleted) as "newLeadCount",
      (select count(*)::int from users where not is_deleted) as "userCount",
      (select count(*)::int from audit_log) as "auditLogCount"`);
  res.json(rows[0]);
});
