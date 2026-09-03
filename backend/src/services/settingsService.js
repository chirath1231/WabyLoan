import { query } from '../db/pool.js';
import { buildUpdate } from '../lib/sql.js';
import { diffFields, recordAudit } from './auditService.js';

export const DEFAULT_SETTINGS = {
  dtiGovernment: 70,
  dtiSemiGovernment: 65,
  dtiPrivate: 60,
  dtiSelfEmployed: 55,
  specialOccupationDiscount: 0.75,
  specialOccupationEnabled: true,
  professionalSchemeDiscount: 1.5,
  professionalSchemeEnabled: true,
  loanRoundingStep: 50000,
  businessLoanEnabled: false,
};

export async function getSettings() {
  const { rows } = await query('SELECT * FROM settings WHERE id = 1');
  if (rows[0]) return rows[0];
  const { rows: created } = await query(
    `INSERT INTO settings (id, "dtiGovernment", "dtiSemiGovernment", "dtiPrivate", "dtiSelfEmployed",
       "specialOccupationDiscount", "specialOccupationEnabled", "professionalSchemeDiscount",
       "professionalSchemeEnabled", "loanRoundingStep", "businessLoanEnabled")
     VALUES (1, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`,
    [
      DEFAULT_SETTINGS.dtiGovernment,
      DEFAULT_SETTINGS.dtiSemiGovernment,
      DEFAULT_SETTINGS.dtiPrivate,
      DEFAULT_SETTINGS.dtiSelfEmployed,
      DEFAULT_SETTINGS.specialOccupationDiscount,
      DEFAULT_SETTINGS.specialOccupationEnabled,
      DEFAULT_SETTINGS.professionalSchemeDiscount,
      DEFAULT_SETTINGS.professionalSchemeEnabled,
      DEFAULT_SETTINGS.loanRoundingStep,
      DEFAULT_SETTINGS.businessLoanEnabled,
    ],
  );
  return created[0];
}

export async function updateSettings(update, adminUserId) {
  const before = await getSettings();
  const { text, values } = buildUpdate('settings', 1, update);
  const { rows } = await query(text, values);
  await recordAudit(adminUserId, 'settings', 'global', diffFields(before, update));
  return rows[0];
}
