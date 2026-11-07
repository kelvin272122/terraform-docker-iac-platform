import express, { type Express } from 'express';

import type { AppConfig } from './config/env.js';
import { errorHandler } from './middleware/error-handler.js';
import { createRecordsRouter } from './records/records.routes.js';
import type { RecordsService } from './records/records.service.js';
import { createHealthRouter } from './routes/health.routes.js';
import { createInfoRouter } from './routes/info.routes.js';
import type { DatabaseStatus } from './services/health.service.js';

export interface AppDependencies {
  readonly checkDatabase: () => Promise<DatabaseStatus>;
  readonly recordsService: RecordsService;
}

export function createApp(config: AppConfig, dependencies: AppDependencies): Express {
  const app = express();

  app.disable('x-powered-by');
  app.use(express.json({ limit: '16kb' }));
  app.use('/api', createInfoRouter(config));
  app.use('/api', createHealthRouter(dependencies.checkDatabase));
  app.use('/api', createRecordsRouter(dependencies.recordsService));

  app.use((_request, response) => {
    response.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: 'Ruta no encontrada.',
      },
    });
  });

  app.use(errorHandler);

  return app;
}
