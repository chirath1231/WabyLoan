import { Router } from 'express';
import { pool } from '../../db/pool.js';

export const adminDashboardRouter = Router();

adminDashboardRouter.get('/', async (req, res) => {
  const [banks, products, companyLists, softLeads, applications, users, auditLog] = await Promise.all([
    pool.query('select count(*)::int as n from banks'),
    pool.query('select count(*)::int as n from products'),
    pool.query('select count(*)::int as n from company_lists'),
    pool.query('select count(*)::int as n from soft_leads'),
    pool.query('select count(*)::int as n from applications'),
    pool.query('select count(*)::int as n from users'),
    pool.query('select count(*)::int as n from audit_log'),
  ]);
  res.json({
    bankCount: banks.rows[0].n,
    productCount: products.rows[0].n,
    companyListCount: companyLists.rows[0].n,
    leadCount: softLeads.rows[0].n + applications.rows[0].n,
    userCount: users.rows[0].n,
    auditLogCount: auditLog.rows[0].n,
  });
});
