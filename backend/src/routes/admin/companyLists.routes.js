import { Router } from 'express';
import { pool } from '../../db/pool.js';
import { getCompanyListsWithEntries } from '../../services/adminData.js';
import { logAudit } from '../../services/auditLog.js';

export const adminCompanyListsRouter = Router();

async function replaceEntries(client, listId, entries, actor) {
  await client.query('delete from company_entries where list_id = $1', [listId]);
  for (const entry of entries) {
    if (!entry.name || !entry.name.trim()) continue;
    await client.query(
      'insert into company_entries (list_id, company_name, sector, created_by) values ($1, $2, $3, $4)',
      [listId, entry.name.trim(), entry.sector || null, actor]
    );
  }
}

adminCompanyListsRouter.get('/', async (req, res) => {
  res.json({ companyLists: await getCompanyListsWithEntries() });
});

adminCompanyListsRouter.post('/', async (req, res) => {
  const { bankId, name, entries } = req.body;
  if (!bankId || !name) return res.status(400).json({ error: 'bankId and name are required.' });
  const client = await pool.connect();
  try {
    await client.query('begin');
    const { rows } = await client.query(
      'insert into company_lists (bank_id, list_name, created_by) values ($1, $2, $3) returning list_id',
      [bankId, name, req.user.email]
    );
    await replaceEntries(client, rows[0].list_id, entries || [], req.user.email);
    await client.query('commit');
    await logAudit(req.user, 'Added company list', name);
    res.status(201).json({ companyList: (await getCompanyListsWithEntries()).find((l) => l.id === rows[0].list_id) });
  } catch (err) {
    await client.query('rollback');
    throw err;
  } finally {
    client.release();
  }
});

adminCompanyListsRouter.put('/:id', async (req, res) => {
  const listId = Number(req.params.id);
  const { name, entries } = req.body;
  const client = await pool.connect();
  try {
    await client.query('begin');
    const found = await client.query(
      `update company_lists set list_name = coalesce($1, list_name), updated_at = now(), updated_by = $3
       where list_id = $2 and not is_deleted returning list_name`,
      [name ?? null, listId, req.user.email]
    );
    if (!found.rows[0]) {
      await client.query('rollback');
      return res.status(404).json({ error: 'Company list not found.' });
    }
    if (Array.isArray(entries)) await replaceEntries(client, listId, entries, req.user.email);
    await client.query('commit');
    await logAudit(req.user, 'Edited company list', found.rows[0].list_name);
    res.json({ ok: true });
  } catch (err) {
    await client.query('rollback');
    throw err;
  } finally {
    client.release();
  }
});

adminCompanyListsRouter.delete('/:id', async (req, res) => {
  const result = await pool.query(
    `update company_lists set is_deleted = true, updated_at = now(), updated_by = $2
     where list_id = $1 and not is_deleted returning list_name`,
    [Number(req.params.id), req.user.email]
  );
  if (!result.rows[0]) return res.status(404).json({ error: 'Company list not found.' });
  // Products that required this list can no longer match anyone; detach them.
  await pool.query('update loan_products set companies_list_id = null where companies_list_id = $1', [Number(req.params.id)]);
  await logAudit(req.user, 'Deleted company list', result.rows[0].list_name);
  res.status(204).end();
});
