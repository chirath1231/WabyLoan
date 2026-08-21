import { Router } from 'express';
import { prisma } from '../../db/prisma.js';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const entries = await prisma.auditLog.findMany({
      include: { adminUser: { select: { id: true, name: true, email: true } } },
      orderBy: { changedAt: 'desc' },
      take: 500,
    });
    res.json(entries);
  } catch (err) {
    next(err);
  }
});

export default router;
