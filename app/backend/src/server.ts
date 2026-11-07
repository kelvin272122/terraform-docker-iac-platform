import { createServer, type Server } from 'node:http';

import type { Pool } from 'pg';

import { createApp } from './app.js';
import { loadConfig } from './config/env.js';
import { createPool } from './db/pool.js';
import { createRecordsRepository } from './records/records.repository.js';
import { createRecordsService } from './records/records.service.js';
import { checkDatabase } from './services/health.service.js';

const SHUTDOWN_TIMEOUT_MS = 10_000;

function main(): void {
  const config = loadConfig();
  const pool = createPool(config.database);
  const recordsService = createRecordsService(createRecordsRepository(pool));
  const server = createServer(
    createApp(config, {
      checkDatabase: () => checkDatabase(pool),
      recordsService,
    }),
  );

  server.on('error', (error) => {
    console.error(
      JSON.stringify({
        level: 'error',
        message: 'server error',
        errorName: error.name,
      }),
    );
    process.exit(1);
  });

  server.listen(config.port, () => {
    console.log(
      JSON.stringify({
        level: 'info',
        message: 'api listening',
        port: config.port,
        environment: config.environment,
      }),
    );
  });

  registerShutdownHandlers(server, pool);
}

function registerShutdownHandlers(server: Server, pool: Pool): void {
  let shuttingDown = false;

  const shutdown = (signal: NodeJS.Signals): void => {
    if (shuttingDown) {
      return;
    }

    shuttingDown = true;
    console.log(JSON.stringify({ level: 'info', message: 'shutdown started', signal }));

    const timeout = setTimeout(() => {
      console.error(JSON.stringify({ level: 'error', message: 'shutdown timed out', signal }));
      process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS);
    timeout.unref();

    server.close((serverError) => {
      void closePool(pool).then((poolError) => {
        clearTimeout(timeout);

        if (serverError || poolError) {
          console.error(
            JSON.stringify({
              level: 'error',
              message: 'shutdown failed',
              signal,
              serverError: serverError !== undefined,
              poolError,
            }),
          );
          process.exit(1);
        }

        console.log(JSON.stringify({ level: 'info', message: 'shutdown complete', signal }));
        process.exit(0);
      });
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

async function closePool(pool: Pool): Promise<boolean> {
  try {
    await pool.end();
    return false;
  } catch {
    return true;
  }
}

try {
  main();
} catch {
  console.error(JSON.stringify({ level: 'error', message: 'api failed to start' }));
  process.exit(1);
}
