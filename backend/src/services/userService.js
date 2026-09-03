import { query } from '../db/pool.js';
import { buildUpdate } from '../lib/sql.js';
import { diffFields, recordAudit } from './auditService.js';

function toAdminUser(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    active: user.active,
    authProvider: user.authProvider,
    createdAt: user.createdAt,
  };
}

export async function listUsers() {
  const { rows } = await query('SELECT * FROM users ORDER BY "createdAt" DESC');
  return rows.map(toAdminUser);
}

export async function updateUser(id, data, adminUserId) {
  const { rows: beforeRows } = await query('SELECT * FROM users WHERE id = $1', [id]);
  const before = beforeRows[0];
  if (!before) throw new Error(`No user record found for id ${id}`);
  const { text, values } = buildUpdate('users', id, data);
  const { rows } = await query(text, values);
  await recordAudit(adminUserId, 'user', id, diffFields(before, data));
  return toAdminUser(rows[0]);
}
