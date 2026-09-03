import pg from 'pg';
import { env } from '../env.js';

const { Pool } = pg;

// Managed Postgres providers (Supabase, Railway, Render, ...) terminate SSL with a chain that
// Node's stricter default verification rejects; localhost dev servers rarely speak SSL at all.
// A `sslmode` left in the URL takes priority over the `ssl` option below, so strip it and decide here.
const dbUrl = new URL(env.databaseUrl);
const isLocalHost = dbUrl.hostname === 'localhost' || dbUrl.hostname === '127.0.0.1';
dbUrl.searchParams.delete('sslmode');
dbUrl.searchParams.delete('schema');

export const pool = new Pool({
  connectionString: dbUrl.toString(),
  ssl: isLocalHost ? false : { rejectUnauthorized: false },
});

export function query(text, params) {
  return pool.query(text, params);
}
