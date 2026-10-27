import { Router } from 'express';
import { pool } from '../../db/pool.js';
import { getAdminSettings, getBenchmarkRates } from '../../services/adminData.js';
import { logAudit } from '../../services/auditLog.js';

export const adminSettingsRouter = Router();

// Settings live in three normalized places: sector_dti_rates (per-sector DTI),
// system_settings (key/value), and master_loan_categories.is_enabled (business loan flag).
const SYSTEM_KEYS = {
  loanRoundingStep: 'LoanRoundingStep',
  pensionMaxAge: 'PensionMaxAge',
  defaultRetirementAge: 'DefaultRetirementAge',
  defaultBenchmarkCode: 'DefaultBenchmarkCode',
};

adminSettingsRouter.get('/', async (req, res) => {
  const [settings, benchmarks] = await Promise.all([getAdminSettings(), getBenchmarkRates()]);
  res.json({ settings, benchmarks });
});

adminSettingsRouter.put('/', async (req, res) => {
  const { dti, businessLoanEnabled, benchmarks } = req.body;
  const actor = req.user.email;
  const changes = [];
  const client = await pool.connect();
  try {
    await client.query('begin');
    for (const [sector, pct] of Object.entries(dti || {})) {
      if (pct === '' || pct == null) continue;
      await client.query(
        `insert into sector_dti_rates (sector_id, max_dti_percent, updated_at, updated_by)
         select sector_id, $2, now(), $3 from master_sectors where code = $1
         on conflict (sector_id) do update set max_dti_percent = excluded.max_dti_percent,
           updated_at = excluded.updated_at, updated_by = excluded.updated_by`,
        [sector, Number(pct), actor]
      );
      changes.push(`DTI ${sector}: ${pct}%`);
    }
    for (const [field, key] of Object.entries(SYSTEM_KEYS)) {
      if (req.body[field] == null || req.body[field] === '') continue;
      await client.query(
        'update system_settings set setting_value = $2, updated_at = now(), updated_by = $3 where setting_key = $1',
        [key, String(req.body[field]), actor]
      );
      changes.push(`${key}: ${req.body[field]}`);
    }
    if (businessLoanEnabled != null) {
      await client.query(
        "update master_loan_categories set is_enabled = $1, updated_at = now(), updated_by = $2 where code = 'business'",
        [!!businessLoanEnabled, actor]
      );
      changes.push(`Business loans ${businessLoanEnabled ? 'enabled' : 'disabled'}`);
    }
    for (const b of benchmarks || []) {
      await client.query(
        `update master_benchmark_rates set rate_value = $2, is_confirmed = coalesce($3, is_confirmed),
           as_of_date = now(), updated_at = now(), updated_by = $4 where code = $1`,
        [b.code, b.rate === '' || b.rate == null ? null : Number(b.rate), b.confirmed ?? null, actor]
      );
      changes.push(`${b.code} AWPLR: ${b.rate}`);
    }
    await client.query('commit');
  } catch (err) {
    await client.query('rollback');
    throw err;
  } finally {
    client.release();
  }
  await logAudit(req.user, 'Changed settings', changes.join('; '));
  const [settings, benchmarkRows] = await Promise.all([getAdminSettings(), getBenchmarkRates()]);
  res.json({ settings, benchmarks: benchmarkRows });
});
