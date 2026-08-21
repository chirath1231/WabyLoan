import { Router } from 'express';
import { z } from 'zod';
import { optionalAuthenticate } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { loanCategorySchema } from '../schemas/eligibility.js';
import { createCallbackRequest, createLead } from '../services/leadService.js';

const router = Router();

// Sri Lankan mobile pattern: 10 digits starting with 0 (SRS §4.4).
const phoneSchema = z.string().regex(/^0\d{9}$/, 'Enter a valid Sri Lankan mobile number (10 digits starting with 0).');

const fullLeadSchema = z.object({
  applicationId: z.string().optional(),
  name: z.string().min(1),
  phone: phoneSchema,
  city: z.string().optional(),
  branch: z.string().optional(),
  bankId: z.string().optional(),
  variantKey: z.string().optional(),
  loanCategory: loanCategorySchema,
  requestedAmount: z.number().optional(),
});

const callbackSchema = z.object({
  applicationId: z.string().optional(),
  name: z.string().min(1),
  phone: phoneSchema,
  loanCategory: loanCategorySchema,
});

// Available even to guests (SRS §6.2) — captures consultative intent regardless of auth state.
router.post('/', optionalAuthenticate, validateBody(fullLeadSchema), async (req, res, next) => {
  try {
    res.status(201).json(await createLead(req.body));
  } catch (err) {
    next(err);
  }
});

router.post('/callback', optionalAuthenticate, validateBody(callbackSchema), async (req, res, next) => {
  try {
    res.status(201).json(await createCallbackRequest(req.body));
  } catch (err) {
    next(err);
  }
});

export default router;
