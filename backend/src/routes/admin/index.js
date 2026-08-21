import { Router } from 'express';
import { authenticate, requireAdmin } from '../../middleware/auth.js';
import banksRouter from './banks.routes.js';
import occupationsRouter from './occupations.routes.js';
import settingsRouter from './settings.routes.js';
import leadsRouter from './leads.routes.js';
import auditRouter from './audit.routes.js';

const router = Router();

// Every /admin/* route requires a valid admin JWT.
router.use(authenticate, requireAdmin);

router.use('/banks', banksRouter);
router.use('/occupations', occupationsRouter);
router.use('/settings', settingsRouter);
router.use('/leads', leadsRouter);
router.use('/audit-log', auditRouter);

export default router;
