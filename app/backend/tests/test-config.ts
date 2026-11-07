import type { AppDependencies } from '../src/app.js';
import type { AppConfig } from '../src/config/env.js';
import type { RecordsService } from '../src/records/records.service.js';

export const testConfig: AppConfig = {
  environment: 'dev',
  appVersion: '0.1.0',
  port: 3000,
  instanceId: 'test-host',
  database: {
    host: 'test-db',
    port: 5432,
    name: 'test-db',
    user: 'test-user',
    password: 'test-password',
  },
};

export const testRecordsService: RecordsService = {
  list: async () => ({ items: [], total: 0 }),
  create: async () => {
    throw new Error('not used');
  },
  remove: async () => {
    throw new Error('not used');
  },
};

export const testDependencies: AppDependencies = {
  checkDatabase: async () => 'up',
  recordsService: testRecordsService,
};
