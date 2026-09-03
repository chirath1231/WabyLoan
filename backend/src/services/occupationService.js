import { query } from '../db/pool.js';
import { buildInsert, buildUpdate } from '../lib/sql.js';
import { newId } from '../lib/id.js';
import { diffFields, recordAudit } from './auditService.js';

export async function listOccupations() {
  const { rows } = await query('SELECT * FROM occupations ORDER BY label ASC');
  return rows;
}

export async function createOccupation(data) {
  const { text, values } = buildInsert('occupations', { id: newId(), ...data });
  const { rows } = await query(text, values);
  return rows[0];
}

export async function updateOccupation(id, data, adminUserId) {
  const { rows: beforeRows } = await query('SELECT * FROM occupations WHERE id = $1', [id]);
  const before = beforeRows[0];
  if (!before) throw new Error(`No occupation record found for id ${id}`);
  const { text, values } = buildUpdate('occupations', id, data);
  const { rows } = await query(text, values);
  await recordAudit(adminUserId, 'occupation', id, diffFields(before, data));
  return rows[0];
}
