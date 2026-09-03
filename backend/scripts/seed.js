import bcrypt from 'bcryptjs';
import { pool } from '../src/db/pool.js';
import { newId } from '../src/lib/id.js';
import { applyDefaultSettings, applyDefaultOccupations, applyDefaultBanks } from '../src/services/defaultsService.js';

async function main() {
  console.log('Seeding settings...');
  await applyDefaultSettings(pool);

  console.log('Seeding occupations...');
  await applyDefaultOccupations(pool);

  console.log('Seeding banks...');
  await applyDefaultBanks(pool);

  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@wabyloan.local';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe123!';
  const { rows: existingAdminRows } = await pool.query('SELECT id FROM users WHERE email = $1', [adminEmail]);
  if (!existingAdminRows[0]) {
    console.log(`Seeding default admin user: ${adminEmail}`);
    await pool.query(
      `INSERT INTO users (id, email, "passwordHash", name, role, "authProvider")
       VALUES ($1, $2, $3, $4, 'admin', 'email')`,
      [newId(), adminEmail, await bcrypt.hash(adminPassword, 10), 'Waby Loan Admin'],
    );
    console.log(`  -> login with ${adminEmail} / ${adminPassword} (change this password after first login)`);
  }

  console.log('Seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
