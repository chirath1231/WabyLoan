import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import { pool } from '../db/pool.js';
import { signToken, requireAuth } from '../middleware/auth.js';

export const authRouter = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const USER_SELECT = `
  select u.user_id as id, u.email, coalesce(u.full_name, u.username) as name, r.code as role,
         u.password_hash, u.is_active
  from users u join master_roles r on r.role_id = u.role_id
  where not u.is_deleted`;

function publicUser({ id, email, name, role }) {
  return { id, email, name, role };
}

authRouter.post(
  '/register',
  body('email').custom((v) => EMAIL_RE.test(v || '')).withMessage('Enter a valid email address.'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters.'),
  body('name').trim().notEmpty().withMessage('Name is required.'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

    const email = req.body.email.trim().toLowerCase();
    const name = req.body.name.trim();
    const existing = await pool.query('select user_id from users where email = $1', [email]);
    if (existing.rows.length) return res.status(409).json({ error: 'An account with this email already exists.' });

    const passwordHash = await bcrypt.hash(req.body.password, 10);
    const role = email === 'admin@waby.lk' ? 'admin' : 'user';
    // Usernames must be unique, so public sign-ups use their email as the username.
    const result = await pool.query(
      `insert into users (username, email, password_hash, full_name, role_id, created_by)
       values ($1, $1, $2, $3, (select role_id from master_roles where code = $4), 'self-registration')
       returning user_id`,
      [email, passwordHash, name, role]
    );
    const user = { id: result.rows[0].user_id, email, name, role };
    res.status(201).json({ token: signToken(user), user });
  }
);

authRouter.post(
  '/login',
  body('email').notEmpty(),
  body('password').notEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: 'Email and password are required.' });

    // Console staff created in SQL (see README) may sign in with their username instead of an email.
    const login = req.body.email.trim().toLowerCase();
    const result = await pool.query(`${USER_SELECT} and (lower(u.email) = $1 or lower(u.username) = $1)`, [login]);
    const user = result.rows[0];
    if (!user || !user.is_active) return res.status(401).json({ error: 'Invalid email or password.' });

    const ok = await bcrypt.compare(req.body.password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid email or password.' });

    await pool.query('update users set last_login_at = now() where user_id = $1', [user.id]);
    res.json({ token: signToken(user), user: publicUser(user) });
  }
);

authRouter.get('/me', requireAuth, async (req, res) => {
  const result = await pool.query(`${USER_SELECT} and u.user_id = $1`, [req.user.sub]);
  const user = result.rows[0];
  if (!user) return res.status(404).json({ error: 'User not found.' });
  res.json({ user: publicUser(user) });
});

// Google/Facebook OAuth are not wired up yet (no client ID/secret provisioned) —
// these placeholders return a clear error instead of a broken redirect so the
// frontend buttons can exist now and be flipped on later without a contract change.
authRouter.get('/google', (req, res) => {
  res.status(501).json({ error: 'Google sign-in is not configured yet.' });
});
authRouter.get('/facebook', (req, res) => {
  res.status(501).json({ error: 'Facebook sign-in is not configured yet.' });
});
