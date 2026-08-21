import { Router } from 'express';
import { z } from 'zod';
import passport from '../auth/passport.js';
import { authenticate } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { oauthEnabled } from '../env.js';
import { getUserById, loginWithEmail, registerWithEmail } from '../services/authService.js';

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post('/register', validateBody(registerSchema), async (req, res, next) => {
  try {
    const { email, password, name } = req.body;
    res.status(201).json(await registerWithEmail(email, password, name));
  } catch (err) {
    next(err);
  }
});

router.post('/login', validateBody(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;
    res.json(await loginWithEmail(email, password));
  } catch (err) {
    next(err);
  }
});

router.get('/me', authenticate, async (req, res, next) => {
  try {
    res.json(await getUserById(req.authUser.id));
  } catch (err) {
    next(err);
  }
});

// OAuth is optional — routes exist but 501 until the operator supplies client credentials.
router.get('/google', (req, res, next) => {
  if (!oauthEnabled.google) return res.status(501).json({ error: 'Google OAuth is not configured on this server.' });
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })(req, res, next);
});
router.get(
  '/google/callback',
  (req, res, next) => {
    if (!oauthEnabled.google) return res.status(501).json({ error: 'Google OAuth is not configured on this server.' });
    passport.authenticate('google', { session: false, failureRedirect: '/auth/failure' })(req, res, next);
  },
  (req, res) => {
    res.json(req.user);
  },
);

router.get('/facebook', (req, res, next) => {
  if (!oauthEnabled.facebook) return res.status(501).json({ error: 'Facebook OAuth is not configured on this server.' });
  passport.authenticate('facebook', { scope: ['email'], session: false })(req, res, next);
});
router.get(
  '/facebook/callback',
  (req, res, next) => {
    if (!oauthEnabled.facebook) return res.status(501).json({ error: 'Facebook OAuth is not configured on this server.' });
    passport.authenticate('facebook', { session: false, failureRedirect: '/auth/failure' })(req, res, next);
  },
  (req, res) => {
    res.json(req.user);
  },
);

router.get('/failure', (_req, res) => res.status(401).json({ error: 'OAuth authentication failed.' }));

export default router;
