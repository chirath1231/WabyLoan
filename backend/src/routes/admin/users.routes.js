import { Router } from 'express';
import { pool } from '../../db/pool.js';
import { requireAdmin } from '../../middleware/auth.js';
import { logAudit } from '../../services/auditLog.js';

export const adminUsersRouter = Router();

adminUsersRouter.get('/', async (req, res) => {
  const result = await pool.query(
    `select u.user_id as id, u.email, u.username, coalesce(u.full_name, u.username) as name,
            r.code as role, r.label as role_label, u.is_active, u.last_login_at, u.created_at
     from users u join master_roles r on r.role_id = u.role_id
     where not u.is_deleted order by u.created_at desc`
  );
  res.json({ users: result.rows });
});

// Only admins may change roles (editors manage content, not people).
adminUsersRouter.put('/:id/role', requireAdmin, async (req, res) => {
  const { role } = req.body;
  const roleRow = await pool.query('select role_id, label from master_roles where code = $1 and is_active', [role]);
  if (!roleRow.rows[0]) return res.status(400).json({ error: 'Unknown role.' });

  const target = await pool.query('select email from users where user_id = $1 and not is_deleted', [Number(req.params.id)]);
  if (!target.rows[0]) return res.status(404).json({ error: 'User not found.' });
  // admin@waby.lk is the seed super-admin account and can't be locked out via the console.
  if (target.rows[0].email === 'admin@waby.lk' && role !== 'admin') {
    return res.status(400).json({ error: 'admin@waby.lk must remain an admin.' });
  }

  await pool.query(
    'update users set role_id = $1, updated_at = now(), updated_by = $3 where user_id = $2',
    [roleRow.rows[0].role_id, Number(req.params.id), req.user.email]
  );
  await logAudit(req.user, 'Changed user role', `${target.rows[0].email} → ${roleRow.rows[0].label}`);
  res.json({ user: { id: Number(req.params.id), email: target.rows[0].email, role } });
});
