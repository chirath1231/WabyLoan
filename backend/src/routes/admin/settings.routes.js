import { Router } from 'express';
import { pool } from '../../db/pool.js';
import { getAdminSettings } from '../../services/adminData.js';
import { logAudit } from '../../services/auditLog.js';

export const adminSettingsRouter = Router();

adminSettingsRouter.get('/', async (req, res) => {
  res.json({ settings: await getAdminSettings() });
});

adminSettingsRouter.put('/', async (req, res) => {
  const { dti, businessLoanEnabled, loanRoundingStep, pensionMaxAge } = req.body;
  await pool.query(
    `update admin_settings set
      dti_government = coalesce($1, dti_government),
      dti_semi_government = coalesce($2, dti_semi_government),
      dti_private = coalesce($3, dti_private),
      dti_self_employed = coalesce($4, dti_self_employed),
      business_loan_enabled = coalesce($5, business_loan_enabled),
      loan_rounding_step = coalesce($6, loan_rounding_step),
      pension_max_age = coalesce($7, pension_max_age),
      updated_at = now()
     where id = true`,
    [
      dti?.government ?? null, dti?.semi_government ?? null, dti?.private ?? null,
      dti?.self_employed ?? null, businessLoanEnabled ?? null, loanRoundingStep ?? null,
      pensionMaxAge ?? null,
    ]
  );
  await logAudit(req.user.email, 'settings.update', req.body);
  res.json({ settings: await getAdminSettings() });
});
