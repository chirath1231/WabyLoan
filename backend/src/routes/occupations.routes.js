import { Router } from 'express';
import { listOccupations } from '../services/occupationService.js';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    res.json(await listOccupations());
  } catch (err) {
    next(err);
  }
});

export default router;
