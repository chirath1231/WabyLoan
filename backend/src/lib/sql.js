// Plain-object values (other than Date) go into jsonb columns and must be sent as text —
// pg only auto-serializes arrays/Dates/primitives, not nested objects.
function serializeValue(v) {
  if (v !== null && typeof v === 'object' && !Array.isArray(v) && !(v instanceof Date)) {
    return JSON.stringify(v);
  }
  return v;
}

/** Builds an `INSERT ... RETURNING *` from a plain data object, skipping undefined fields. */
export function buildInsert(table, data) {
  const keys = Object.keys(data).filter((k) => data[k] !== undefined);
  const columns = keys.map((k) => `"${k}"`).join(', ');
  const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
  const values = keys.map((k) => serializeValue(data[k]));
  return { text: `INSERT INTO ${table} (${columns}) VALUES (${placeholders}) RETURNING *`, values };
}

/** Builds an `UPDATE ... WHERE id = $n RETURNING *` from a plain data object, skipping undefined fields. */
export function buildUpdate(table, id, data) {
  const keys = Object.keys(data).filter((k) => data[k] !== undefined);
  const values = keys.map((k) => serializeValue(data[k]));
  const setClauses = keys.map((k, i) => `"${k}" = $${i + 1}`);
  setClauses.push('"updatedAt" = now()');
  values.push(id);
  return { text: `UPDATE ${table} SET ${setClauses.join(', ')} WHERE id = $${values.length} RETURNING *`, values };
}
