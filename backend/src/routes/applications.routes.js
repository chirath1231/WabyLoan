import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { prisma } from '../db/prisma.js';

const router = Router();

// Guest sessions never persist an application row (SRS §6.3) — nothing to list without auth.
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const applications = await prisma.application.findMany({
      where: { userId: req.authUser.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json(applications);
  } catch (err) {
    next(err);
  }
});

export default router;
