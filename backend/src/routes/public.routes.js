import { Router } from 'express';
import { pool } from '../db/pool.js';
import { getOccupations, getAdminSettings } from '../services/adminData.js';

export const publicRouter = Router();

publicRouter.get('/occupations', async (req, res) => {
  res.json({ occupations: await getOccupations() });
});

// Only the fields Step 1/2 of the wizard need (business-loan flag, pension age cap) —
// DTI ceilings and rounding step stay admin-only since they're closer to proprietary
// business rules than UI configuration.
publicRouter.get('/settings/public', async (req, res) => {
  const settings = await getAdminSettings();
  res.json({ businessLoanEnabled: settings.businessLoanEnabled, pensionMaxAge: settings.pensionMaxAge });
});
