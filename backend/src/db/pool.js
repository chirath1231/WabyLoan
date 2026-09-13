import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

// Supabase's pooler presents a cert chain Node's default trust store won't
// fully verify; TLS is still negotiated, so this only relaxes certificate
// verification, not encryption. Skipped entirely for a plain local Postgres.
// The `sslmode` query param is stripped because pg-connection-string derives
// its own ssl object from it, which otherwise overrides the explicit `ssl`
// option below instead of being overridden by it.
const rawUrl = process.env.DATABASE_URL || '';
const needsRelaxedSsl = /sslmode=require/.test(rawUrl);
const connectionString = rawUrl.replace(/([?&])sslmode=require&?/, '$1').replace(/[?&]$/, '');

export const pool = new Pool({
  connectionString,
  ssl: needsRelaxedSsl ? { rejectUnauthorized: false } : undefined,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle Postgres client', err);
});

export async function query(text, params) {
  return pool.query(text, params);
}
