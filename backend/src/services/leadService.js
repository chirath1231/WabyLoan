import { query } from '../db/pool.js';
import { buildInsert } from '../lib/sql.js';
import { newId } from '../lib/id.js';

export async function createLead(input) {
  const { text, values } = buildInsert('leads', { id: newId(), ...input });
  const { rows } = await query(text, values);
  return rows[0];
}

export async function createCallbackRequest(input) {
  const { text, values } = buildInsert('callback_requests', { id: newId(), ...input });
  const { rows } = await query(text, values);
  return rows[0];
}

/** Combined table for the Admin Console dashboard (SRS §5.4), tagged Full vs Callback. */
export async function listAllLeadsCombined() {
  const [{ rows: leads }, { rows: callbacks }] = await Promise.all([
    query(
      `SELECT l.*, b.name AS "bankName" FROM leads l LEFT JOIN banks b ON b.id = l."bankId" ORDER BY l."createdAt" DESC`,
    ),
    query('SELECT * FROM callback_requests ORDER BY "createdAt" DESC'),
  ]);

  const tagged = [
    ...leads.map((l) => ({
      id: l.id,
      type: 'full',
      name: l.name,
      phone: l.phone,
      city: l.city,
      bankName: l.bankName ?? null,
      loanCategory: l.loanCategory,
      requestedAmount: l.requestedAmount,
      createdAt: l.createdAt,
    })),
    ...callbacks.map((c) => ({
      id: c.id,
      type: 'callback',
      name: c.name,
      phone: c.phone,
      city: null,
      bankName: null,
      loanCategory: c.loanCategory,
      requestedAmount: null,
      createdAt: c.createdAt,
    })),
  ];

  return tagged.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}
