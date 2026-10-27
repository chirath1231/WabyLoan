import { Router } from 'express';
import { pool } from '../../db/pool.js';

export const adminAuditLogRouter = Router();

adminAuditLogRouter.get('/', async (req, res) => {
  const result = await pool.query(
    `select a.audit_log_id as id, coalesce(u.email, 'System') as actor_email, a.action_type as action, a.details, a.created_at
     from audit_log a left join users u on u.user_id = a.user_id
     order by a.created_at desc limit 300`
  );
  res.json({ auditLog: result.rows });
});
