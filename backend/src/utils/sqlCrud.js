// Small helper for building parameterized INSERT/UPDATE statements from a
// {jsKey: {column, lookup?}} field map — used by the admin bank/product CRUD
// routes, which have ~20-45 editable fields each, to avoid hand-writing every
// column list twice (insert + update) per resource.
//
// `lookup: 'master_x'` means the client sends that table's `code` and the
// column stores its id, resolved with a sub-select (an unknown code fails the
// NOT NULL / FK constraint instead of silently storing nothing).

function valueSql(def, placeholder) {
  if (!def.lookup) return placeholder;
  const idColumn = def.column;
  return `(select ${def.lookupId || idColumn} from ${def.lookup} where code = ${placeholder})`;
}

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
    columns.push(def.column);
    placeholders.push(valueSql(def, `$${i++}`));
    values.push(body[jsKey] === '' ? null : body[jsKey]);
  }

  const text = `insert into ${table} (${columns.join(', ')}) values (${placeholders.join(', ')}) returning *`;
  return { text, values };
}

export function buildUpdate(table, idColumn, idValue, fieldMap, body, actor) {
  const sets = [];
  const values = [];
  let i = 1;

  for (const [jsKey, def] of Object.entries(fieldMap)) {
    if (!(jsKey in body)) continue;
    sets.push(`${def.column} = ${valueSql(def, `$${i++}`)}`);
    values.push(body[jsKey] === '' ? null : body[jsKey]);
  }

  if (!sets.length) return null;
  sets.push('updated_at = now()');
  sets.push(`updated_by = $${i++}`);
  values.push(actor || null);
  values.push(idValue);
  const text = `update ${table} set ${sets.join(', ')} where ${idColumn} = $${i} returning *`;
  return { text, values };
}
