import { Router } from 'express';
import { validateBody } from '../../middleware/validate.js';
import { settingsUpdateSchema } from '../../schemas/admin.js';
import { getSettings, updateSettings } from '../../services/settingsService.js';
import { resetAllToDefaults } from '../../services/resetService.js';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    res.json(await getSettings());
  } catch (err) {
    next(err);
  }
});

router.put('/', validateBody(settingsUpdateSchema), async (req, res, next) => {
  try {
    res.json(await updateSettings(req.body, req.authUser.id));
  } catch (err) {
    next(err);
  }
});

/**
 * Restores banks, occupations, and settings to the shipped baseline (SRS §5.3). The prototype
 * has no confirmation step for this — the web admin console must confirm client-side before
 * calling this, given the blast radius.
 */
router.post('/reset-defaults', async (req, res, next) => {
  try {
    await resetAllToDefaults(req.authUser.id);
    res.json(await getSettings());
  } catch (err) {
    next(err);
  }
});

export default router;
