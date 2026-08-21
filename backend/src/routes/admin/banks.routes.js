import { Router } from 'express';
import { validateBody } from '../../middleware/validate.js';
import { bankUpdateSchema, bankWriteSchema } from '../../schemas/admin.js';
import { createBank, listAllBanks, updateBank } from '../../services/bankService.js';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    res.json(await listAllBanks());
  } catch (err) {
    next(err);
  }
});

router.post('/', validateBody(bankWriteSchema), async (req, res, next) => {
  try {
    const body = req.body;
    const data = { ...body, updatedDate: new Date(body.updatedDate) };
    res.status(201).json(await createBank(data));
  } catch (err) {
    next(err);
  }
});

router.put('/:id', validateBody(bankUpdateSchema), async (req, res, next) => {
  try {
    const body = req.body;
    const data = { ...body, updatedDate: body.updatedDate ? new Date(body.updatedDate) : undefined };
    res.json(await updateBank(req.params.id, data, req.authUser.id));
  } catch (err) {
    next(err);
  }
});

export default router;
