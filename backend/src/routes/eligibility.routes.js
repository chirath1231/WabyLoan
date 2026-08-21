import { Router } from 'express';
import { optionalAuthenticate } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { eligibilityInputSchema } from '../schemas/eligibility.js';
import { evaluateEligibility } from '../services/eligibilityService.js';

const router = Router();

router.post('/evaluate', optionalAuthenticate, validateBody(eligibilityInputSchema), async (req, res, next) => {
  try {
    const outcome = await evaluateEligibility(req.body, req.authUser);
    res.json(outcome);
  } catch (err) {
    next(err);
  }
});

export default router;
