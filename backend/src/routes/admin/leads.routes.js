import { Router } from 'express';
import { listAllLeadsCombined } from '../../services/leadService.js';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    res.json(await listAllLeadsCombined());
  } catch (err) {
    next(err);
  }
});

export default router;
