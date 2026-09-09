import { Router } from 'express';
import { validateBody } from '../../middleware/validate.js';
import { loanProductUpdateSchema, loanProductWriteSchema } from '../../schemas/admin.js';
import { createLoanProduct, listAllLoanProducts, updateLoanProduct } from '../../services/loanProductService.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    res.json(await listAllLoanProducts(req.query.bankId));
  } catch (err) {
    next(err);
  }
});

router.post('/', validateBody(loanProductWriteSchema), async (req, res, next) => {
  try {
    res.status(201).json(await createLoanProduct(req.body));
  } catch (err) {
    next(err);
  }
});

router.put('/:id', validateBody(loanProductUpdateSchema), async (req, res, next) => {
  try {
    res.json(await updateLoanProduct(req.params.id, req.body, req.authUser.id));
  } catch (err) {
    next(err);
  }
});

export default router;
