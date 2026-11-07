import type { Pool, PoolClient } from 'pg';
import { describe, expect, it, vi } from 'vitest';

import { checkDatabase } from '../src/services/health.service.js';

function fakeClient(query: () => Promise<unknown>): PoolClient {
  return {
    query,
    release: vi.fn(),
  } as unknown as PoolClient;
}

describe('checkDatabase', () => {
  it('returns up and releases the client normally on success', async () => {
    const client = fakeClient(async () => ({ rows: [{ '?column?': 1 }] }));
    const pool = { connect: async () => client } as unknown as Pool;

    await expect(checkDatabase(pool, 100)).resolves.toBe('up');
    expect(client.release).toHaveBeenCalledWith(false);
  });

  it('returns down and discards the client when the query fails', async () => {
    const client = fakeClient(async () => {
      throw new Error('query failed');
    });
    const pool = { connect: async () => client } as unknown as Pool;

    await expect(checkDatabase(pool, 100)).resolves.toBe('down');
    expect(client.release).toHaveBeenCalledWith(true);
  });

  it('returns down when the pool cannot provide a connection', async () => {
    const pool = {
      connect: async () => {
        throw new Error('connection refused');
      },
    } as unknown as Pool;

    await expect(checkDatabase(pool, 100)).resolves.toBe('down');
  });

  it('returns down within the total timeout when acquisition never resolves', async () => {
    const pool = {
      connect: () => new Promise<PoolClient>(() => undefined),
    } as unknown as Pool;

    const startedAt = Date.now();
    await expect(checkDatabase(pool, 20)).resolves.toBe('down');
    expect(Date.now() - startedAt).toBeLessThan(200);
  });

  it('discards a client acquired after the deadline', async () => {
    const client = fakeClient(async () => ({ rows: [] }));
    const pool = {
      connect: () => new Promise<PoolClient>((resolve) => setTimeout(() => resolve(client), 50)),
    } as unknown as Pool;

    await expect(checkDatabase(pool, 10)).resolves.toBe('down');
    await new Promise((resolve) => setTimeout(resolve, 80));

    expect(client.release).toHaveBeenCalledTimes(1);
    expect(client.release).toHaveBeenCalledWith(true);
  });
});
