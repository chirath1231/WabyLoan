import { Router } from 'express';
import { pool } from '../../db/pool.js';
import { getOccupations } from '../../services/adminData.js';
import { logAudit } from '../../services/auditLog.js';

export const adminOccupationsRouter = Router();

// Occupations are addressed by their code ('doctor', 'engineer', ...), which is what
// the wizard submits and what product_target_occupations resolves through.
adminOccupationsRouter.get('/', async (req, res) => {
  res.json({ occupations: await getOccupations() });
});

adminOccupationsRouter.post('/', async (req, res) => {
  const { id, label, special } = req.body;
  if (!id || !label) return res.status(400).json({ error: 'id and label are required.' });
  const exists = await pool.query('select occupation_id, is_deleted from master_occupations where code = $1', [id]);
  if (exists.rows[0] && !exists.rows[0].is_deleted) return res.status(409).json({ error: 'An occupation with this id already exists.' });

  await pool.query(
    `insert into master_occupations (code, label, is_special_scheme, sort_order, created_by)
     values ($1, $2, $3, (select coalesce(max(sort_order), 0) + 1 from master_occupations), $4)
     on conflict (code) do update set label = excluded.label, is_special_scheme = excluded.is_special_scheme,
       is_deleted = false, is_active = true, updated_at = now(), updated_by = excluded.created_by`,
    [id, label, !!special, req.user.email]
  );
  await logAudit(req.user, 'Added occupation', `${id} — ${label}`);
  res.status(201).json({ occupation: (await getOccupations()).find((o) => o.id === id) });
});

adminOccupationsRouter.put('/:id', async (req, res) => {
  const { label, special } = req.body;
  const result = await pool.query(
    `update master_occupations set label = coalesce($1, label), is_special_scheme = coalesce($2, is_special_scheme),
       updated_at = now(), updated_by = $4
     where code = $3 and not is_deleted returning label`,
    [label ?? null, special ?? null, req.params.id, req.user.email]
  );
  if (!result.rows[0]) return res.status(404).json({ error: 'Occupation not found.' });
  await logAudit(req.user, 'Edited occupation', result.rows[0].label);
  res.json({ occupation: (await getOccupations()).find((o) => o.id === req.params.id) });
});

adminOccupationsRouter.delete('/:id', async (req, res) => {
  const result = await pool.query(
    `update master_occupations set is_deleted = true, updated_at = now(), updated_by = $2
     where code = $1 and not is_deleted returning occupation_id`,
    [req.params.id, req.user.email]
  );
  if (!result.rows[0]) return res.status(404).json({ error: 'Occupation not found.' });
  await logAudit(req.user, 'Deleted occupation', `Occupation ID ${result.rows[0].occupation_id}`);
  res.status(204).end();
});
