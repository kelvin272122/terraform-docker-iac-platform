import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from '../src/api/errors.js';
import { createApp } from '../src/app.js';
import type { RecordItem } from '../src/records/records.model.js';
import type { RecordsService } from '../src/records/records.service.js';
import { testConfig, testDependencies } from './test-config.js';

const record: RecordItem = {
  id: '00000000-0000-4000-8000-000000000001',
  title: 'Prueba',
  description: null,
  createdAt: '2026-01-01T00:00:00.000Z',
};

function fakeService(overrides: Partial<RecordsService> = {}): RecordsService {
  return {
    list: vi.fn(async () => ({ items: [], total: 0 })),
    create: vi.fn(async () => record),
    remove: vi.fn(async () => undefined),
    ...overrides,
  };
}

function appWith(service: RecordsService) {
  return createApp(testConfig, { ...testDependencies, recordsService: service });
}

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('records routes', () => {
  it('returns an empty list and total 0', async () => {
    const response = await request(appWith(fakeService())).get('/api/records');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ items: [], total: 0 });
  });

  it('returns the list provided by the service', async () => {
    const service = fakeService({
      list: vi.fn(async () => ({ items: [record], total: 1 })),
    });

    const response = await request(appWith(service)).get('/api/records');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ items: [record], total: 1 });
  });

  it('passes the request body to the service and returns 201', async () => {
    const create = vi.fn(async () => record);
    const service = fakeService({ create });

    const response = await request(appWith(service))
      .post('/api/records')
      .send({ title: 'Prueba' });

    expect(response.status).toBe(201);
    expect(response.body).toEqual(record);
    expect(create).toHaveBeenCalledWith({ title: 'Prueba' });
  });

  it('returns 400 with fields when creation is invalid', async () => {
    const service = fakeService({
      create: vi.fn(async () => {
        throw ApiError.validation('Revisa los datos enviados.', {
          title: 'El título es obligatorio.',
        });
      }),
    });

    const response = await request(appWith(service))
      .post('/api/records')
      .send({});

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Revisa los datos enviados.',
        fields: { title: 'El título es obligatorio.' },
      },
    });
  });

  it('deletes a record with 204 and no body', async () => {
    const remove = vi.fn(async () => undefined);
    const service = fakeService({ remove });

    const response = await request(appWith(service)).delete(
      '/api/records/00000000-0000-4000-8000-000000000001',
    );

    expect(response.status).toBe(204);
    expect(response.text).toBe('');
    expect(remove).toHaveBeenCalledWith('00000000-0000-4000-8000-000000000001');
  });

  it('returns 400 for an invalid UUID', async () => {
    const service = fakeService({
      remove: vi.fn(async () => {
        throw ApiError.validation('El identificador no es un UUID válido.', {
          id: 'El identificador no es un UUID válido.',
        });
      }),
    });

    const response = await request(appWith(service)).delete('/api/records/no-uuid');

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 404 RECORD_NOT_FOUND when the record does not exist', async () => {
    const service = fakeService({
      remove: vi.fn(async () => {
        throw ApiError.recordNotFound();
      }),
    });

    const response = await request(appWith(service)).delete(
      '/api/records/00000000-0000-4000-8000-000000000099',
    );

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: {
        code: 'RECORD_NOT_FOUND',
        message: 'El registro no existe.',
      },
    });
  });

  it('returns a safe 503 when the database is unavailable', async () => {
    const service = fakeService({
      list: vi.fn(async () => {
        throw ApiError.databaseUnavailable();
      }),
    });

    const response = await request(appWith(service)).get('/api/records');

    expect(response.status).toBe(503);
    expect(response.body).toEqual({
      error: {
        code: 'DATABASE_UNAVAILABLE',
        message: 'La base de datos no está disponible.',
      },
    });
    expect(JSON.stringify(response.body)).not.toMatch(
      /password|select|stack|econnrefused/i,
    );
  });
});
