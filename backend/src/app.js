import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';

import { authRouter } from './routes/auth.routes.js';
import { eligibilityRouter } from './routes/eligibility.routes.js';
import { publicRouter } from './routes/public.routes.js';
import { leadsRouter, applicationsRouter } from './routes/leads.routes.js';
import { ocrRouter } from './routes/ocr.routes.js';

import { adminBanksRouter } from './routes/admin/banks.routes.js';
import { adminProductsRouter } from './routes/admin/products.routes.js';
import { adminOccupationsRouter } from './routes/admin/occupations.routes.js';
import { adminCompanyListsRouter } from './routes/admin/companyLists.routes.js';
import { adminSettingsRouter } from './routes/admin/settings.routes.js';
import { adminUsersRouter } from './routes/admin/users.routes.js';
import { adminLeadsRouter } from './routes/admin/leads.routes.js';
import { adminAuditLogRouter } from './routes/admin/auditLog.routes.js';
import { adminDashboardRouter } from './routes/admin/dashboard.routes.js';

import { requireAuth, requireAdmin } from './middleware/auth.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';

export function createApp() {
  const app = express();

  const allowedOrigins = (process.env.CORS_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
  app.use(cors({ origin: allowedOrigins.length ? allowedOrigins : true, credentials: true }));
  app.use(express.json({ limit: '2mb' }));
  app.use(cookieParser());
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

  app.get('/api/health', (req, res) => res.json({ ok: true }));

  app.use('/api/auth', authRouter);
  app.use('/api/eligibility', eligibilityRouter);
  app.use('/api', publicRouter);
  app.use('/api/leads', leadsRouter);
  app.use('/api/applications', applicationsRouter);
  app.use('/api/ocr', ocrRouter);

  const admin = express.Router();
  admin.use(requireAuth, requireAdmin);
  admin.use('/banks', adminBanksRouter);
  admin.use('/products', adminProductsRouter);
  admin.use('/occupations', adminOccupationsRouter);
  admin.use('/company-lists', adminCompanyListsRouter);
  admin.use('/settings', adminSettingsRouter);
  admin.use('/users', adminUsersRouter);
  admin.use('/leads', adminLeadsRouter);
  admin.use('/audit-log', adminAuditLogRouter);
  admin.use('/dashboard', adminDashboardRouter);
  app.use('/api/admin', admin);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
