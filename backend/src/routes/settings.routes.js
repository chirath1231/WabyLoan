import { Router } from 'express';
import { getSettings } from '../services/settingsService.js';

const router = Router();

/**
 * Public, display-relevant settings only. DTI thresholds are internal risk metrics and must
 * never be surfaced to end users (SRS §1.4 progressive disclosure) — they are deliberately
 * omitted here even though the Admin Console can read/write them via /admin/settings.
 */
router.get('/public', async (_req, res, next) => {
  try {
    const s = await getSettings();
    res.json({
      businessLoanEnabled: s.businessLoanEnabled,
      professionalSchemeEnabled: s.professionalSchemeEnabled,
      loanRoundingStep: s.loanRoundingStep,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
