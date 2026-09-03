import { query } from '../db/pool.js';
import { buildInsert, buildUpdate } from '../lib/sql.js';
import { newId } from '../lib/id.js';
import { diffFields, recordAudit } from './auditService.js';

export async function listActiveBanks() {
  const { rows } = await query('SELECT * FROM banks WHERE active = true ORDER BY name ASC');
  return rows;
}

export async function listAllBanks() {
  const { rows } = await query('SELECT * FROM banks ORDER BY name ASC');
  return rows;
}

export async function getBank(id) {
  const { rows } = await query('SELECT * FROM banks WHERE id = $1', [id]);
  return rows[0] ?? null;
}

export async function createBank(data) {
  const { text, values } = buildInsert('banks', { id: newId(), ...data });
  const { rows } = await query(text, values);
  return rows[0];
}

export async function updateBank(id, data, adminUserId) {
  const { rows: beforeRows } = await query('SELECT * FROM banks WHERE id = $1', [id]);
  const before = beforeRows[0];
  if (!before) throw new Error(`No bank record found for id ${id}`);
  const { text, values } = buildUpdate('banks', id, data);
  const { rows } = await query(text, values);
  await recordAudit(adminUserId, 'bank', id, diffFields(before, data));
  return rows[0];
}

/** No delete endpoint exists — Active/Inactive toggle only, a deliberate SRS decision (Appendix C.6). */
export async function setBankActive(id, active, adminUserId) {
  return updateBank(id, { active }, adminUserId);
}
