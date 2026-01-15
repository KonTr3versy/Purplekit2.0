import express, { type Express, type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { pinoHttp } from 'pino-http';

import { config } from './config';
import { logger } from './lib/logger';
import { errorHandler, notFoundHandler } from './middleware/error';
import { rateLimiter } from './middleware/rate-limit';
import { authRouter } from './routes/auth';
import { usersRouter } from './routes/users';
import { engagementsRouter } from './routes/engagements';
import { techniquesRouter } from './routes/techniques';
import { actionsRouter } from './routes/actions';
import { validationsRouter } from './routes/validations';
import { findingsRouter } from './routes/findings';
import { reportsRouter } from './routes/reports';
import { attackRouter } from './routes/attack';
import { analyticsRouter } from './routes/analytics';
import { settingsRouter } from './routes/settings';
import { auditRouter } from './routes/audit';

export function createApp(): Express {
  const app = express();

  // ---------------------------------------------------------------------------
  // Security & Middleware
  // ---------------------------------------------------------------------------
  
  // Security headers
  app.use(helmet());

  // CORS
  app.use(cors({
    origin: config.corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  }));

  // Compression
  app.use(compression());

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Request logging
  app.use(pinoHttp({
    logger,
    autoLogging: {
      ignore: (req) => req.url === '/health',
    },
  }));

  // Rate limiting
  app.use(rateLimiter);

  // ---------------------------------------------------------------------------
  // Health Check
  // ---------------------------------------------------------------------------
  app.get('/health', (_req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: config.version,
    });
  });

  // ---------------------------------------------------------------------------
  // API Routes (v1)
  // ---------------------------------------------------------------------------
  const v1Router = express.Router();

  // Auth (no authentication required)
  v1Router.use('/auth', authRouter);

  // Protected routes
  v1Router.use('/users', usersRouter);
  v1Router.use('/engagements', engagementsRouter);
  v1Router.use('/engagements/:engagementId/techniques', techniquesRouter);
  v1Router.use('/actions', actionsRouter);
  v1Router.use('/validations', validationsRouter);
  v1Router.use('/findings', findingsRouter);
  v1Router.use('/reports', reportsRouter);
  v1Router.use('/attack', attackRouter);
  v1Router.use('/analytics', analyticsRouter);
  v1Router.use('/settings', settingsRouter);
  v1Router.use('/audit', auditRouter);

  app.use('/api/v1', v1Router);

  // ---------------------------------------------------------------------------
  // Error Handling
  // ---------------------------------------------------------------------------
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
