import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import { pool } from '../db/pool.js';
import { signToken, requireAuth } from '../middleware/auth.js';

export const authRouter = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

authRouter.post(
  '/register',
  body('email').custom((v) => EMAIL_RE.test(v || '')).withMessage('Enter a valid email address.'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters.'),
  body('name').trim().notEmpty().withMessage('Name is required.'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

    const email = req.body.email.trim().toLowerCase();
    const { name } = req.body;
    const existing = await pool.query('select id from users where email = $1', [email]);
    if (existing.rows.length) return res.status(409).json({ error: 'An account with this email already exists.' });

    const passwordHash = await bcrypt.hash(req.body.password, 10);
    const role = email === 'admin@waby.lk' ? 'admin' : 'user';
    const result = await pool.query(
      `insert into users (email, password_hash, name, role) values ($1,$2,$3,$4)
       returning id, email, name, role`,
      [email, passwordHash, name, role]
    );
    const user = result.rows[0];
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

    const email = req.body.email.trim().toLowerCase();
    const result = await pool.query('select id, email, name, role, password_hash from users where email = $1', [email]);
    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: 'Invalid email or password.' });

    const ok = await bcrypt.compare(req.body.password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid email or password.' });

    delete user.password_hash;
    res.json({ token: signToken(user), user });
  }
);

authRouter.get('/me', requireAuth, async (req, res) => {
  const result = await pool.query('select id, email, name, role from users where id = $1', [req.user.sub]);
  const user = result.rows[0];
  if (!user) return res.status(404).json({ error: 'User not found.' });
  res.json({ user });
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
