import { describe, expect, it } from 'vitest';

import { loadConfig } from '../src/config/env.js';

const baseEnv = {
  APP_ENV: 'dev',
  APP_VERSION: '0.1.0',
  DB_HOST: 'postgres',
  DB_NAME: 'iac_panel',
  DB_USER: 'iac_app',
  DB_PASSWORD: 'test-password',
};

describe('loadConfig', () => {
  it('accepts a valid configuration with DB variables', () => {
    const config = loadConfig({
      ...baseEnv,
      PORT: '3000',
      DB_PORT: '5432',
    });

    expect(config.environment).toBe('dev');
    expect(config.appVersion).toBe('0.1.0');
    expect(config.port).toBe(3000);
    expect(config.instanceId.length).toBeGreaterThan(0);
    expect(config.database).toEqual({
      host: 'postgres',
      port: 5432,
      name: 'iac_panel',
      user: 'iac_app',
      password: 'test-password',
    });
  });

  it('defaults the application and database ports', () => {
    const config = loadConfig({
      ...baseEnv,
      APP_ENV: 'prod',
      APP_VERSION: '1.0.0',
    });

    expect(config.port).toBe(3000);
    expect(config.database.port).toBe(5432);
  });

  it.each([
    ['missing APP_ENV', { ...baseEnv, APP_ENV: undefined }],
    ['invalid APP_ENV', { ...baseEnv, APP_ENV: 'test' }],
    ['missing APP_VERSION', { ...baseEnv, APP_VERSION: undefined }],
    ['blank APP_VERSION', { ...baseEnv, APP_VERSION: '   ' }],
    ['non-numeric PORT', { ...baseEnv, PORT: 'abc' }],
    ['zero PORT', { ...baseEnv, PORT: '0' }],
    ['too large PORT', { ...baseEnv, PORT: '65536' }],
    ['missing DB_HOST', { ...baseEnv, DB_HOST: undefined }],
    ['blank DB_HOST', { ...baseEnv, DB_HOST: '   ' }],
    ['missing DB_NAME', { ...baseEnv, DB_NAME: undefined }],
    ['missing DB_USER', { ...baseEnv, DB_USER: undefined }],
    ['missing DB_PASSWORD', { ...baseEnv, DB_PASSWORD: undefined }],
    ['non-numeric DB_PORT', { ...baseEnv, DB_PORT: 'abc' }],
    ['zero DB_PORT', { ...baseEnv, DB_PORT: '0' }],
    ['too large DB_PORT', { ...baseEnv, DB_PORT: '65536' }],
  ])('rejects %s', (_name, env) => {
    expect(() => loadConfig(env)).toThrow();
  });
});
