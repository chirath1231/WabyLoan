// Small helper for building parameterized INSERT/UPDATE statements from a
// {jsKey: {column, json?}} field map — used by the admin bank/product CRUD
// routes, which have ~20-35 editable fields each, to avoid hand-writing every
// column list twice (insert + update) per resource.

export function buildInsert(table, fieldMap, body, extra = {}) {
  const columns = [];
  const placeholders = [];
  const values = [];
  let i = 1;

  for (const [key, val] of Object.entries(extra)) {
    columns.push(key);
    placeholders.push(`$${i++}`);
    values.push(val);
  }

  for (const [jsKey, def] of Object.entries(fieldMap)) {
    if (!(jsKey in body)) continue;
    const raw = body[jsKey];
    columns.push(def.column);
    placeholders.push(`$${i++}`);
    values.push(def.json ? JSON.stringify(raw) : raw);
  }

  const text = `insert into ${table} (${columns.join(', ')}) values (${placeholders.join(', ')}) returning *`;
  return { text, values };
}

export function buildUpdate(table, idColumn, idValue, fieldMap, body) {
  const sets = [];
  const values = [];
  let i = 1;

  for (const [jsKey, def] of Object.entries(fieldMap)) {
    if (!(jsKey in body)) continue;
    const raw = body[jsKey];
    sets.push(`${def.column} = $${i++}`);
    values.push(def.json ? JSON.stringify(raw) : raw);
  }

  if (!sets.length) return null;
  sets.push('updated_at = now()');
  values.push(idValue);
  const text = `update ${table} set ${sets.join(', ')} where ${idColumn} = $${i} returning *`;
  return { text, values };
}
