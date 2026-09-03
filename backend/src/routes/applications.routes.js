import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { query } from '../db/pool.js';

const router = Router();

// Guest sessions never persist an application row (SRS §6.3) — nothing to list without auth.
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT id, "userId", "loanCategory", sector, "occupationId", age, "retirementAge",
              "incomeProfile", "categoryDetails", "resultsSnapshot", "createdAt"
       FROM applications
       WHERE "userId" = $1
       ORDER BY "createdAt" DESC
       LIMIT 50`,
      [req.authUser.id],
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

export default router;
