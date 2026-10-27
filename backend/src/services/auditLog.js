import { pool } from '../db/pool.js';

// audit_log.details is a short human-readable line (varchar 1000), as in the SQL Server original.
export async function logAudit(user, actionType, details) {
  const text = details == null ? null : typeof details === 'string' ? details : JSON.stringify(details);
  await pool.query(
    'insert into audit_log (user_id, action_type, details) values ($1, $2, $3)',
    [user?.sub || null, actionType, text ? text.slice(0, 1000) : null]
  );
}
