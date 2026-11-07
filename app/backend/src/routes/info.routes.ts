import { Router } from 'express';

import type { AppConfig } from '../config/env.js';

export const API_VERSION = 'v1';

export function createInfoRouter(config: AppConfig): Router {
  const router = Router();

  router.get('/info', (_request, response) => {
    response.status(200).json({
      environment: config.environment,
      apiVersion: API_VERSION,
      appVersion: config.appVersion,
      instanceId: config.instanceId,
    });
  });

  return router;
}
