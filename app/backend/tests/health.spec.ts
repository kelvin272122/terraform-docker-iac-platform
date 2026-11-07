import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createApp } from '../src/app.js';
import { testConfig, testDependencies } from './test-config.js';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('GET /api/health', () => {
  it('returns 200 when the database is available', async () => {
    const response = await request(
      createApp(testConfig, { ...testDependencies, checkDatabase: async () => 'up' }),
    ).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/application\/json/);
    expect(response.body).toMatchObject({
      status: 'ok',
      api: 'up',
      database: 'up',
    });
    expect(new Date(response.body.checkedAt).toISOString()).toBe(response.body.checkedAt);
  });

  it('returns 503 when the database is unavailable', async () => {
    const response = await request(
      createApp(testConfig, { ...testDependencies, checkDatabase: async () => 'down' }),
    ).get('/api/health');

    expect(response.status).toBe(503);
    expect(response.body).toMatchObject({
      status: 'degraded',
      api: 'up',
      database: 'down',
    });
    expect(new Date(response.body.checkedAt).toISOString()).toBe(response.body.checkedAt);
  });

  it('does not expose internal details or credentials', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const response = await request(
      createApp(testConfig, {
        ...testDependencies,
        checkDatabase: async () => {
          throw new Error('password=secret sql=SELECT 1');
        },
      }),
    ).get('/api/health');

    const body = JSON.stringify(response.body);

    expect(response.status).toBe(500);
    expect(body).not.toMatch(/secret|password|sql|select|stack|test-password/i);
  });

  it('uses only the approved response fields', async () => {
    const response = await request(
      createApp(testConfig, { ...testDependencies, checkDatabase: async () => 'up' }),
    ).get('/api/health');

    expect(Object.keys(response.body).sort()).toEqual(
      ['api', 'checkedAt', 'database', 'status'].sort(),
    );
  });
});
