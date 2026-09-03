import { query } from '../db/pool.js';
import { newId } from '../lib/id.js';

function toAuditString(v) {
  if (v === null || v === undefined) return null;
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (v instanceof Date) return v.toISOString();
  if (Array.isArray(v)) return JSON.stringify(v);
  // Postgres numeric columns come back as strings, so no Decimal-like wrapper to special-case here
  // (unlike the old Prisma Decimal) — falling through to JSON.stringify is enough for plain objects.
  return JSON.stringify(v);
}

/** Writes one AuditLog row per changed field (SRS §5.5 — required for every Admin Console mutation). */
export async function recordAudit(adminUserId, entityType, entityId, changes) {
  const actual = changes.filter((c) => toAuditString(c.oldValue) !== toAuditString(c.newValue));
  if (actual.length === 0) return;

  const cols = 7;
  const values = [];
  const rowPlaceholders = actual.map((c, i) => {
    const o = i * cols;
    values.push(newId(), adminUserId, entityType, entityId, c.field, toAuditString(c.oldValue), toAuditString(c.newValue));
    return `($${o + 1}, $${o + 2}, $${o + 3}, $${o + 4}, $${o + 5}, $${o + 6}, $${o + 7})`;
  });

  await query(
    `INSERT INTO audit_log (id, "adminUserId", "entityType", "entityId", field, "oldValue", "newValue")
     VALUES ${rowPlaceholders.join(', ')}`,
    values,
  );
}

/** Diffs two plain objects field-by-field and returns the AuditFieldChange list for recordAudit. */
export function diffFields(before, after) {
  return Object.keys(after)
    .filter((k) => after[k] !== undefined)
    .map((k) => ({ field: k, oldValue: before[k], newValue: after[k] }));
}
