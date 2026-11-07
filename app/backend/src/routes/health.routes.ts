import { Router } from 'express';

import type { DatabaseStatus } from '../services/health.service.js';

export function createHealthRouter(checkDatabase: () => Promise<DatabaseStatus>): Router {
  const router = Router();

  router.get('/health', async (_request, response) => {
    const database = await checkDatabase();
    const isHealthy = database === 'up';

    response.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? 'ok' : 'degraded',
      api: 'up',
      database,
      checkedAt: new Date().toISOString(),
    });
  });

  return router;
}
