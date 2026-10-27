// Converts the SQL Server script export (WabyLoanDB.sql, UTF-16) into a PostgreSQL seed
// (src/db/seed.sql) for the schema in src/db/schema.sql.
//
//   node scripts/convert-mssql-dump.js [path/to/WabyLoanDB.sql]
//
// Table/column names go PascalCase -> snake_case, N'..' / CAST(.. AS ..) literals are unwrapped,
// bit columns become true/false, and every identity sequence is advanced past the seeded ids.
// Transactional/credential tables (Leads, AuditLog, Users) are deliberately not carried over.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcPath = process.argv[2] || path.join(__dirname, '..', '..', 'WabyLoanDB.sql');
const outPath = path.join(__dirname, '..', 'src', 'db', 'seed.sql');

const SKIP_TABLES = new Set(['Leads', 'AuditLog', 'Users']);

// FK-safe insert order (parents before children).
const TABLE_ORDER = [
  'MasterBankTypes', 'MasterBenchmarkRates', 'MasterCollateralTypes', 'MasterCurrencies',
  'MasterDocChargeBasis', 'MasterGenders', 'MasterGuarantorTerms', 'MasterInsuranceTypes',
  'MasterInterestRateTypes', 'MasterLeadStatuses', 'MasterLoanCategories', 'MasterOccupations',
  'MasterProductStatuses', 'MasterRoles', 'MasterSectors',
  'Banks', 'BankAllowedSectors', 'BankMaxTermsByCategory', 'BankRemarks',
  'CompanyLists', 'CompanyEntries',
  'LoanProducts', 'ProductInterestRateTiers', 'ProductRemarks', 'ProductTargetOccupations',
  'SectorDtiRates', 'SectorOccupationIncomePolicies', 'SystemSettings', 'SystemSettingsRetired',
  'EntityTranslations',
];

const NAME_OVERRIDES = { WhatsApp: 'whatsapp' };

function snake(name) {
  if (NAME_OVERRIDES[name]) return NAME_OVERRIDES[name];
  return name
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
    .toLowerCase();
}

function readDump(file) {
  const buf = fs.readFileSync(file);
  const isUtf16 = buf[0] === 0xff && buf[1] === 0xfe;
  return (isUtf16 ? buf.toString('utf16le').slice(1) : buf.toString('utf8')).replace(/\r\n/g, '\n');
}

// { TableName: { ColumnName: 'bit' | 'int' | ... } } from the CREATE TABLE blocks.
function parseColumnTypes(sql) {
  const types = {};
  const re = /CREATE TABLE \[dbo\]\.\[(\w+)\]\(\n([\s\S]*?)\n(?:PRIMARY KEY|\s*CONSTRAINT|\) ON)/g;
  let m;
  while ((m = re.exec(sql))) {
    const cols = {};
    for (const line of m[2].split('\n')) {
      const c = line.match(/^\s*\[(\w+)\] \[(\w+)\]/);
      if (c) cols[c[1]] = c[2].toLowerCase();
    }
    types[m[1]] = cols;
  }
  return types;
}

// Scans one VALUES (...) list starting just after the opening paren.
// Each value comes back as { text, str } where `str` is its single string literal, if it had one.
function scanValues(sql, i) {
  const values = [];
  let cur = { text: '', str: null };
  let depth = 0;
  while (i < sql.length) {
    const ch = sql[i];
    if (ch === "'") {
      let j = i + 1;
      let str = '';
      while (j < sql.length) {
        if (sql[j] === "'" && sql[j + 1] === "'") { str += "'"; j += 2; continue; }
        if (sql[j] === "'") break;
        str += sql[j++];
      }
      cur.str = str;
      cur.text += "''";
      i = j + 1;
      continue;
    }
    if (ch === '(') depth++;
    if (ch === ')') {
      if (depth === 0) { values.push(cur); return [values, i + 1]; }
      depth--;
    }
    if (ch === ',' && depth === 0) { values.push(cur); cur = { text: '', str: null }; i++; continue; }
    cur.text += ch;
    i++;
  }
  throw new Error('Unterminated VALUES list');
}

function pgLiteral({ text, str }, type) {
  const v = text.trim();
  if (/^NULL$/i.test(v)) return 'null';
  if (str !== null) {
    if (type === 'bit') return str === '1' ? 'true' : 'false';
    return `'${str.replace(/'/g, "''")}'`;
  }
  // CAST(12.5 AS Decimal(6, 3)) -> 12.5
  const cast = v.match(/^CAST\((.*) AS [\w ]+(\(\d+(, ?\d+)?\))?\)$/i);
  const bare = cast ? cast[1].trim() : v;
  if (type === 'bit') return bare === '1' ? 'true' : 'false';
  if (/^-?\d+(\.\d+)?$/.test(bare)) return bare;
  throw new Error(`Unrecognised literal: ${text}`);
}

function convert() {
  const sql = readDump(srcPath);
  const types = parseColumnTypes(sql);
  const rowsByTable = {};

  const insertRe = /INSERT \[dbo\]\.\[(\w+)\] \(([^)]*)\) VALUES \(/g;
  let m;
  while ((m = insertRe.exec(sql))) {
    const table = m[1];
    const [values, end] = scanValues(sql, insertRe.lastIndex);
    insertRe.lastIndex = end;
    if (SKIP_TABLES.has(table)) continue;
    const columns = m[2].split(',').map((c) => c.trim().replace(/^\[|\]$/g, ''));
    const literals = values.map((v, idx) => pgLiteral(v, types[table]?.[columns[idx]]));
    (rowsByTable[table] ||= { columns, rows: [] }).rows.push(literals);
  }

  const unknown = Object.keys(rowsByTable).filter((t) => !TABLE_ORDER.includes(t));
  if (unknown.length) throw new Error(`Add these tables to TABLE_ORDER: ${unknown.join(', ')}`);

  const out = [
    '-- Generated by scripts/convert-mssql-dump.js from WabyLoanDB.sql. Do not edit by hand; re-run the script.',
    'begin;',
    '',
  ];
  for (const table of TABLE_ORDER) {
    const data = rowsByTable[table];
    if (!data) continue;
    const pgTable = snake(table);
    const cols = data.columns.map(snake).join(', ');
    out.push(`-- ${table} (${data.rows.length})`);
    for (const row of data.rows) {
      out.push(`insert into ${pgTable} (${cols}) values (${row.join(', ')}) on conflict do nothing;`);
    }
    // Identity tables: the first column is the surrogate key.
    const idCol = snake(data.columns[0]);
    if (idCol.endsWith('_id') && types[table]?.[data.columns[0]] === 'int' && !/^(bank_allowed|bank_max|product_target|sector_)/.test(pgTable)) {
      out.push(`select setval(pg_get_serial_sequence('${pgTable}', '${idCol}'), (select max(${idCol}) from ${pgTable}));`);
    }
    out.push('');
  }

  // Public applicant accounts for the React app (not part of the SQL Server original).
  out.push("insert into master_roles (code, label) values ('user', 'Applicant') on conflict (code) do nothing;");
  out.push('', 'commit;', '');

  fs.writeFileSync(outPath, out.join('\n'));
  const total = Object.values(rowsByTable).reduce((n, t) => n + t.rows.length, 0);
  console.log(`Wrote ${total} rows across ${Object.keys(rowsByTable).length} tables to ${path.relative(process.cwd(), outPath)}`);
}

convert();
