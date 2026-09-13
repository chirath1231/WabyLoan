import { pool } from '../db/pool.js';

export async function logAudit(actorEmail, action, details) {
  await pool.query(
    `insert into audit_log (actor_email, action, details) values ($1, $2, $3)`,
    [actorEmail || 'Unknown', action, details ? JSON.stringify(details) : null]
  );
}
