import { Router } from 'express';
import { pool } from '../../db/pool.js';
import { logAudit } from '../../services/auditLog.js';

export const adminUsersRouter = Router();

adminUsersRouter.get('/', async (req, res) => {
  const result = await pool.query('select id, email, name, role, created_at from users order by created_at desc');
  res.json({ users: result.rows });
});

adminUsersRouter.put('/:id/role', async (req, res) => {
  const { role } = req.body;
  if (!['user', 'admin'].includes(role)) return res.status(400).json({ error: "role must be 'user' or 'admin'." });

  const target = await pool.query('select email from users where id = $1', [req.params.id]);
  if (!target.rows[0]) return res.status(404).json({ error: 'User not found.' });
  // admin@waby.lk is the seed super-admin account and can't be locked out via the console.
  if (target.rows[0].email === 'admin@waby.lk' && role !== 'admin') {
    return res.status(400).json({ error: 'admin@waby.lk must remain an admin.' });
  }

  const result = await pool.query('update users set role = $1 where id = $2 returning id, email, name, role', [role, req.params.id]);
  await logAudit(req.user.email, 'user.roleChange', { userId: req.params.id, role });
  res.json({ user: result.rows[0] });
});
