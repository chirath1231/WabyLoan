import { Router } from 'express';
import { pool } from '../../db/pool.js';

export const adminProductsRouter = Router();

// Flat cross-bank product listing for the admin "Loan Products" tab (search/filter
// by bank client-side; mutations still go through /admin/banks/:bankId/products/:id).
adminProductsRouter.get('/', async (req, res) => {
  const result = await pool.query(
    `select p.*, b.name as bank_name, b.short as bank_short
     from products p join banks b on b.id = p.bank_id
     order by b.name asc, p.name asc`
  );
  res.json({ products: result.rows });
});
