import { prisma } from '../db/prisma.js';

function toAuditString(v) {
  if (v === null || v === undefined) return null;
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (v instanceof Date) return v.toISOString();
  if (Array.isArray(v)) return JSON.stringify(v);
  // Prisma Decimal (and similar wrapper objects) expose a meaningful toString() — using it
  // (instead of JSON.stringify, which would quote it as a string) keeps a Decimal "0.5" and the
  // plain number 0.5 comparing equal, so saving a form without touching a rate field doesn't
  // spuriously log it as changed.
  if (typeof v === 'object' && typeof v.toString === 'function' && v.toString !== Object.prototype.toString) {
    return v.toString();
  }
  return JSON.stringify(v);
}

/** Writes one AuditLog row per changed field (SRS §5.5 — required for every Admin Console mutation). */
export async function recordAudit(adminUserId, entityType, entityId, changes) {
  const actual = changes.filter((c) => toAuditString(c.oldValue) !== toAuditString(c.newValue));
  if (actual.length === 0) return;
  await prisma.auditLog.createMany({
    data: actual.map((c) => ({
      adminUserId,
      entityType,
      entityId,
      field: c.field,
      oldValue: toAuditString(c.oldValue),
      newValue: toAuditString(c.newValue),
    })),
  });
}

/** Diffs two plain objects field-by-field and returns the AuditFieldChange list for recordAudit. */
export function diffFields(before, after) {
  return Object.keys(after)
    .filter((k) => after[k] !== undefined)
    .map((k) => ({ field: k, oldValue: before[k], newValue: after[k] }));
}
