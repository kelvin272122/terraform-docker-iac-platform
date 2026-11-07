import { Pool } from 'pg';

import type { DatabaseConfig } from '../config/env.js';

export const POOL_MAX_CONNECTIONS = 10;
export const POOL_IDLE_TIMEOUT_MS = 30_000;
export const POOL_CONNECTION_TIMEOUT_MS = 1_000;
export const QUERY_TIMEOUT_MS = 2_000;

export function createPool(config: DatabaseConfig): Pool {
  const pool = new Pool({
    host: config.host,
    port: config.port,
    database: config.name,
    user: config.user,
    password: config.password,
    max: POOL_MAX_CONNECTIONS,
    idleTimeoutMillis: POOL_IDLE_TIMEOUT_MS,
    connectionTimeoutMillis: POOL_CONNECTION_TIMEOUT_MS,
    query_timeout: QUERY_TIMEOUT_MS,
    statement_timeout: QUERY_TIMEOUT_MS,
    application_name: 'iac-panel-api',
  });

  pool.on('error', (error) => {
    console.error(
      JSON.stringify({
        level: 'error',
        message: 'database pool error',
        errorName: error instanceof Error ? error.name : 'UnknownError',
      }),
    );
  });

  return pool;
}
