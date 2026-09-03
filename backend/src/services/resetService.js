import { pool } from '../db/pool.js';
import { applyDefaultSettings, applyDefaultOccupations, applyDefaultBanks } from './defaultsService.js';
import { recordAudit } from './auditService.js';

/**
 * Restores all bank records, the occupation list, DTI thresholds, discount percentages, and
 * feature flags to their shipped baseline (SRS §5.3). The prototype has no confirmation step
 * for this — production must require one client-side before calling this endpoint, given the
 * blast radius of the action.
 */
export async function resetAllToDefaults(adminUserId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await applyDefaultSettings(client);
    await applyDefaultOccupations(client);
    await applyDefaultBanks(client);
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  await recordAudit(adminUserId, 'system', 'all', [
    { field: 'reset_to_defaults', oldValue: null, newValue: new Date().toISOString() },
  ]);
}
