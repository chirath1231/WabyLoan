import { Router } from 'express';
import { listActiveBanks } from '../services/bankService.js';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    res.json(await listActiveBanks());
  } catch (err) {
    next(err);
  }
});

export default router;
