import { Router } from 'express';
import { pool } from '../../db/pool.js';
import { getCompanyListsWithEntries } from '../../services/adminData.js';
import { logAudit } from '../../services/auditLog.js';

export const adminCompanyListsRouter = Router();

adminCompanyListsRouter.get('/', async (req, res) => {
  res.json({ companyLists: await getCompanyListsWithEntries() });
});

adminCompanyListsRouter.post('/', async (req, res) => {
  const { id, bankId, name, entries } = req.body;
  if (!id || !bankId || !name) return res.status(400).json({ error: 'id, bankId, and name are required.' });
  const result = await pool.query(
    `insert into company_lists (id, bank_id, name) values ($1,$2,$3) returning *`,
    [id, bankId, name]
  );
  for (const entry of entries || []) {
    await pool.query(
      `insert into company_list_entries (list_id, name, tier, sector) values ($1,$2,$3,$4)`,
      [id, entry.name, entry.tier, entry.sector]
    );
  }
  await logAudit(req.user.email, 'companyList.create', { id, bankId });
  res.status(201).json({ companyList: result.rows[0] });
});

adminCompanyListsRouter.put('/:id', async (req, res) => {
  const { name, entries } = req.body;
  if (name != null) {
    await pool.query('update company_lists set name = $1 where id = $2', [name, req.params.id]);
  }
  if (Array.isArray(entries)) {
    await pool.query('delete from company_list_entries where list_id = $1', [req.params.id]);
    for (const entry of entries) {
      await pool.query(
        `insert into company_list_entries (list_id, name, tier, sector) values ($1,$2,$3,$4)`,
        [req.params.id, entry.name, entry.tier, entry.sector]
      );
    }
  }
  await logAudit(req.user.email, 'companyList.update', { id: req.params.id });
  res.json({ ok: true });
});

adminCompanyListsRouter.delete('/:id', async (req, res) => {
  const result = await pool.query('delete from company_lists where id = $1 returning id', [req.params.id]);
  if (!result.rows[0]) return res.status(404).json({ error: 'Company list not found.' });
  await logAudit(req.user.email, 'companyList.delete', { id: req.params.id });
  res.status(204).end();
});
