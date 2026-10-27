import { Router } from 'express';
import { getOccupations, getAdminSettings, getLoanCategories, getSectors } from '../services/adminData.js';

export const publicRouter = Router();

publicRouter.get('/occupations', async (req, res) => {
  res.json({ occupations: await getOccupations() });
});

// Lookup data the wizard renders from (Step 1 category cards, Step 2 sector cards / occupation select).
publicRouter.get('/master-data', async (req, res) => {
  const [loanCategories, sectors, occupations] = await Promise.all([getLoanCategories(), getSectors(), getOccupations()]);
  res.json({
    loanCategories,
    sectors: sectors.map(({ id, label }) => ({ id, label })),
    occupations,
  });
});

// Only the fields Step 1/2 of the wizard need (business-loan flag, pension age cap) —
// DTI ceilings and rounding step stay admin-only since they're closer to proprietary
// business rules than UI configuration.
publicRouter.get('/settings/public', async (req, res) => {
  const settings = await getAdminSettings();
  res.json({
    businessLoanEnabled: settings.businessLoanEnabled,
    pensionMaxAge: settings.pensionMaxAge,
    defaultRetirementAge: settings.defaultRetirementAge,
  });
});
