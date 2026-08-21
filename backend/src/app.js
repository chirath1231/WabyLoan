import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { env } from './env.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import authRouter from './routes/auth.routes.js';
import banksRouter from './routes/banks.routes.js';
import occupationsRouter from './routes/occupations.routes.js';
import settingsRouter from './routes/settings.routes.js';
import eligibilityRouter from './routes/eligibility.routes.js';
import leadsRouter from './routes/leads.routes.js';
import applicationsRouter from './routes/applications.routes.js';
import ocrRouter from './routes/ocr.routes.js';
import adminRouter from './routes/admin/index.js';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.corsOrigins, credentials: true }));
  app.use(express.json({ limit: '2mb' }));
  if (env.nodeEnv !== 'test') app.use(morgan(env.nodeEnv === 'development' ? 'dev' : 'combined'));

  // Generous global limit; tighter limits can be layered onto /auth and /leads later if abused.
  app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 600, standardHeaders: true, legacyHeaders: false }));

  app.get('/health', (_req, res) => res.json({ ok: true }));

  app.use('/auth', authRouter);
  app.use('/banks', banksRouter);
  app.use('/occupations', occupationsRouter);
  app.use('/settings', settingsRouter);
  app.use('/eligibility', eligibilityRouter);
  app.use('/leads', leadsRouter);
  app.use('/applications', applicationsRouter);
  app.use('/ocr', ocrRouter);
  app.use('/admin', adminRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
