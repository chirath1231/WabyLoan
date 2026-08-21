import { Router } from 'express';
import { validateBody } from '../../middleware/validate.js';
import { occupationUpdateSchema, occupationWriteSchema } from '../../schemas/admin.js';
import { createOccupation, listOccupations, updateOccupation } from '../../services/occupationService.js';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    res.json(await listOccupations());
  } catch (err) {
    next(err);
  }
});

router.post('/', validateBody(occupationWriteSchema), async (req, res, next) => {
  try {
    res.status(201).json(await createOccupation(req.body));
  } catch (err) {
    next(err);
  }
});

router.put('/:id', validateBody(occupationUpdateSchema), async (req, res, next) => {
  try {
    res.json(await updateOccupation(req.params.id, req.body, req.authUser.id));
  } catch (err) {
    next(err);
  }
});

export default router;
