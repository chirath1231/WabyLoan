import { Router } from 'express';
import { validateBody } from '../../middleware/validate.js';
import { userUpdateSchema } from '../../schemas/admin.js';
import { listUsers, updateUser } from '../../services/userService.js';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    res.json(await listUsers());
  } catch (err) {
    next(err);
  }
});

router.put('/:id', validateBody(userUpdateSchema), async (req, res, next) => {
  try {
    if (req.params.id === req.authUser.id) {
      return res.status(400).json({ error: 'You cannot change your own role or status.' });
    }
    res.json(await updateUser(req.params.id, req.body, req.authUser.id));
  } catch (err) {
    next(err);
  }
});

export default router;
