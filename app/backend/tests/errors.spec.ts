import express from 'express';
import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createApp } from '../src/app.js';
import { errorHandler } from '../src/middleware/error-handler.js';
import { testConfig, testDependencies } from './test-config.js';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('API errors', () => {
  it('returns a JSON 404 for unknown routes', async () => {
    const response = await request(createApp(testConfig, testDependencies)).get('/api/unknown');

    expect(response.status).toBe(404);
    expect(response.headers['content-type']).toMatch(/application\/json/);
    expect(response.body).toEqual({
      error: {
        code: 'NOT_FOUND',
        message: 'Ruta no encontrada.',
      },
    });
  });

  it('returns a safe 400 for malformed JSON', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const response = await request(createApp(testConfig, testDependencies))
      .post('/api/unknown')
      .set('Content-Type', 'application/json')
      .send('{"broken":');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'El cuerpo JSON no es válido.',
      },
    });
    expect(JSON.stringify(response.body)).not.toMatch(/stack|syntaxerror|at /i);
  });

  it('returns a safe 413 when the JSON body exceeds 16 KiB', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const payload = JSON.stringify({ value: 'x'.repeat(17 * 1024) });
    const response = await request(createApp(testConfig, testDependencies))
      .post('/api/unknown')
      .set('Content-Type', 'application/json')
      .send(payload);

    expect(response.status).toBe(413);
    expect(response.body).toEqual({
      error: {
        code: 'PAYLOAD_TOO_LARGE',
        message: 'El cuerpo de la solicitud supera el límite permitido.',
      },
    });
  });

  it('does not expose internal error details', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const app = express();
    app.get('/boom', () => {
      throw new Error('secret internal detail');
    });
    app.use(errorHandler);

    const response = await request(app).get('/boom');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Ocurrió un error interno.',
      },
    });
    expect(JSON.stringify(response.body)).not.toContain('secret internal detail');
    expect(JSON.stringify(response.body)).not.toMatch(/stack|sql|password/i);
  });
});
