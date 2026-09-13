import { Router } from 'express';
import { pool } from '../../db/pool.js';
import { logAudit } from '../../services/auditLog.js';

export const adminOccupationsRouter = Router();

adminOccupationsRouter.get('/', async (req, res) => {
  const result = await pool.query('select * from occupations order by label asc');
  res.json({ occupations: result.rows });
});

adminOccupationsRouter.post('/', async (req, res) => {
  const { id, label, special } = req.body;
  if (!id || !label) return res.status(400).json({ error: 'id and label are required.' });
  const result = await pool.query(
    `insert into occupations (id, label, special) values ($1,$2,$3) returning *`,
    [id, label, !!special]
  );
  await logAudit(req.user.email, 'occupation.create', { id, label });
  res.status(201).json({ occupation: result.rows[0] });
});

adminOccupationsRouter.put('/:id', async (req, res) => {
  const { label, special } = req.body;
  const result = await pool.query(
    `update occupations set label = coalesce($1, label), special = coalesce($2, special) where id = $3 returning *`,
    [label ?? null, special ?? null, req.params.id]
  );
  if (!result.rows[0]) return res.status(404).json({ error: 'Occupation not found.' });
  await logAudit(req.user.email, 'occupation.update', { id: req.params.id, fields: Object.keys(req.body) });
  res.json({ occupation: result.rows[0] });
});

adminOccupationsRouter.delete('/:id', async (req, res) => {
  const result = await pool.query('delete from occupations where id = $1 returning id', [req.params.id]);
  if (!result.rows[0]) return res.status(404).json({ error: 'Occupation not found.' });
  await logAudit(req.user.email, 'occupation.delete', { id: req.params.id });
  res.status(204).end();
});
