import type { Pool, PoolClient } from 'pg';

export const HEALTH_TOTAL_TIMEOUT_MS = 3_000;

export type DatabaseStatus = 'up' | 'down';

export async function checkDatabase(
  pool: Pool,
  totalTimeoutMs: number = HEALTH_TOTAL_TIMEOUT_MS,
): Promise<DatabaseStatus> {
  let client: PoolClient | undefined;
  let released = false;
  let timedOut = false;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const release = (discard: boolean): void => {
    if (!client || released) {
      return;
    }

    released = true;
    const acquired = client;
    client = undefined;
    acquired.release(discard);
  };

  const operation = (async (): Promise<DatabaseStatus> => {
    const acquired = await pool.connect();
    client = acquired;

    if (timedOut) {
      release(true);
      return 'down';
    }

    try {
      await acquired.query('SELECT 1');
      release(false);
      return 'up';
    } catch {
      release(true);
      return 'down';
    }
  })();

  const timeout = new Promise<DatabaseStatus>((resolve) => {
    timer = setTimeout(() => {
      timedOut = true;
      release(true);
      resolve('down');
    }, totalTimeoutMs);
  });

  try {
    return await Promise.race([operation, timeout]);
  } catch {
    release(true);
    return 'down';
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}
