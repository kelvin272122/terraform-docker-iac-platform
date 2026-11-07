import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { createApp } from '../src/app.js';
import { testConfig, testDependencies } from './test-config.js';

describe('GET /api/info', () => {
  it('returns the configured environment, versions and instance id', async () => {
    const response = await request(createApp(testConfig, testDependencies)).get('/api/info');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/application\/json/);
    expect(response.body).toEqual({
      environment: 'dev',
      apiVersion: 'v1',
      appVersion: '0.1.0',
      instanceId: 'test-host',
    });
  });

  it('stays available when the database is down', async () => {
    const response = await request(
      createApp(testConfig, { ...testDependencies, checkDatabase: async () => 'down' }),
    ).get('/api/info');

    expect(response.status).toBe(200);
    expect(response.body).not.toHaveProperty('database');
  });
});
