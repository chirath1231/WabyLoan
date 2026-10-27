import { Router } from 'express';
import { getProducts, getLookups, getBenchmarkRates, getLoanCategories, getSectors, getOccupations } from '../../services/adminData.js';
import { pool } from '../../db/pool.js';

export const adminProductsRouter = Router();

// Flat cross-bank product listing for the admin "Loan Products" tab (search/filter
// by bank client-side; mutations still go through /admin/banks/:bankId/products/:id).
adminProductsRouter.get('/', async (req, res) => {
  const [products, banks] = await Promise.all([
    getProducts(),
    pool.query('select bank_id, name, short_name from banks where not is_deleted'),
  ]);
  const bankById = new Map(banks.rows.map((b) => [b.bank_id, b]));
  res.json({
    products: products
      .filter((p) => bankById.has(p.bankId))
      .map((p) => ({ ...p, bankName: bankById.get(p.bankId).name, bankShort: bankById.get(p.bankId).short_name })),
  });
});

// Every select option the bank/product drawers need, from the master_* tables.
export const adminLookupsRouter = Router();

adminLookupsRouter.get('/', async (req, res) => {
  const [lookups, benchmarks, loanCategories, sectors, occupations] = await Promise.all([
    getLookups(), getBenchmarkRates(), getLoanCategories(), getSectors(), getOccupations(),
  ]);
  res.json({
    ...lookups,
    benchmarks,
    loanCategories,
    sectors: sectors.map(({ id, label }) => ({ id, label })),
    occupations: occupations.map(({ id, label }) => ({ id, label })),
  });
});
