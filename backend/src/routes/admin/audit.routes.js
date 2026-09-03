import { Router } from 'express';
import { query } from '../../db/pool.js';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT a.id, a."adminUserId", a."entityType", a."entityId", a.field, a."oldValue", a."newValue", a."changedAt",
              u.id AS "adminUser_id", u.name AS "adminUser_name", u.email AS "adminUser_email"
       FROM audit_log a
       JOIN users u ON u.id = a."adminUserId"
       ORDER BY a."changedAt" DESC
       LIMIT 500`,
    );
    const entries = rows.map((r) => ({
      id: r.id,
      adminUserId: r.adminUserId,
      entityType: r.entityType,
      entityId: r.entityId,
      field: r.field,
      oldValue: r.oldValue,
      newValue: r.newValue,
      changedAt: r.changedAt,
      adminUser: { id: r.adminUser_id, name: r.adminUser_name, email: r.adminUser_email },
    }));
    res.json(entries);
  } catch (err) {
    next(err);
  }
});

export default router;
