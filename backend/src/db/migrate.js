import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from './pool.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// The pre-WabyLoanDB schema used text-keyed `banks`/`users` tables with the same names. Running the
// new schema over it would leave those old tables in place and fail on the first foreign key, so stop
// with an explanation instead (migrating a live database is a deliberate, separate step).
async function assertNoLegacySchema() {
  const { rows } = await pool.query(
    `select 1 from information_schema.columns
     where table_schema = current_schema() and table_name = 'banks' and column_name = 'short'`
  );
  if (rows.length) {
    throw new Error(
      'This database still has the old schema (banks.short / soft_leads / applications). '
      + 'Point DATABASE_URL at a new database, or back up and drop the old tables first.'
    );
  }
}

async function migrate() {
  await assertNoLegacySchema();
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await pool.query(sql);
  console.log('Migration complete.');
  await pool.end();
}

migrate().catch(async (err) => {
  console.error('Migration failed:', err.message);
  await pool.end();
  process.exit(1);
});
