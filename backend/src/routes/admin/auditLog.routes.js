import { Router } from 'express';
import { pool } from '../../db/pool.js';

export const adminAuditLogRouter = Router();

adminAuditLogRouter.get('/', async (req, res) => {
  const result = await pool.query('select * from audit_log order by created_at desc limit 300');
  res.json({ auditLog: result.rows });
});
