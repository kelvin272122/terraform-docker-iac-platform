import { Router } from 'express';

import type { RecordsService } from './records.service.js';

export function createRecordsRouter(service: RecordsService): Router {
  const router = Router();

  router.get('/records', async (_request, response) => {
    const records = await service.list();
    response.status(200).json(records);
  });

  router.post('/records', async (request, response) => {
    const created = await service.create(request.body);
    response.status(201).json(created);
  });

  router.delete('/records/:id', async (request, response) => {
    await service.remove(request.params.id);
    response.status(204).end();
  });

  return router;
}
