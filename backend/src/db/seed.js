// Loads seed.sql (the WabyLoanDB reference data: lookups, 10 banks, 50 products, rate tiers, company
// lists, settings) and makes sure the console has a super-admin. Safe to re-run: every insert is
// `on conflict do nothing`. Regenerate seed.sql with `npm run convert-dump`.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import { pool } from './pool.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function seed() {
  await pool.query(fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf8'));
  console.log('Reference data loaded.');

  const email = process.env.SEED_ADMIN_EMAIL || 'admin@waby.lk';
  const password = process.env.SEED_ADMIN_PASSWORD;
  const existing = await pool.query('select 1 from users where email = $1', [email]);
  if (existing.rows.length) {
    console.log(`Admin ${email} already exists.`);
  } else if (!password) {
    console.log(`No admin created: set SEED_ADMIN_PASSWORD (and optionally SEED_ADMIN_EMAIL) and re-run to create ${email}.`);
  } else {
    await pool.query(
      `insert into users (username, email, password_hash, full_name, role_id, created_by)
       values ('admin', $1, $2, 'Administrator', (select role_id from master_roles where code = 'admin'), 'seed')`,
      [email, await bcrypt.hash(password, 10)]
    );
    console.log(`Created admin ${email}.`);
  }
  await pool.end();
}

seed().catch(async (err) => {
  console.error('Seed failed:', err.message);
  await pool.end();
  process.exit(1);
});
