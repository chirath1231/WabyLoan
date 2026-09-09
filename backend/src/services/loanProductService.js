import { query } from '../db/pool.js';
import { buildInsert, buildUpdate } from '../lib/sql.js';
import { newId } from '../lib/id.js';
import { diffFields, recordAudit } from './auditService.js';

export async function listAllLoanProducts(bankId) {
  if (bankId) {
    const { rows } = await query('SELECT * FROM loan_products WHERE "bankId" = $1 ORDER BY name ASC', [bankId]);
    return rows;
  }
  const { rows } = await query('SELECT * FROM loan_products ORDER BY name ASC');
  return rows;
}

export async function getLoanProduct(id) {
  const { rows } = await query('SELECT * FROM loan_products WHERE id = $1', [id]);
  return rows[0] ?? null;
}

export async function createLoanProduct(data) {
  const { text, values } = buildInsert('loan_products', { id: newId(), ...data });
  const { rows } = await query(text, values);
  return rows[0];
}

export async function updateLoanProduct(id, data, adminUserId) {
  const { rows: beforeRows } = await query('SELECT * FROM loan_products WHERE id = $1', [id]);
  const before = beforeRows[0];
  if (!before) throw new Error(`No loan product record found for id ${id}`);
  const { text, values } = buildUpdate('loan_products', id, data);
  const { rows } = await query(text, values);
  await recordAudit(adminUserId, 'loan_product', id, diffFields(before, data));
  return rows[0];
}
