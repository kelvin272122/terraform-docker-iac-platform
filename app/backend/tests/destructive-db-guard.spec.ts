import type { Pool } from 'pg';
import { describe, expect, it, vi } from 'vitest';

import { assertDestructiveTestDatabase } from './destructive-db-guard.js';

function baseEnv(overrides: NodeJS.ProcessEnv = {}): NodeJS.ProcessEnv {
  return {
    RUN_DB_INTEGRATION: '1',
    DESTRUCTIVE_DB_TESTS: '1',
    DB_NAME: 'iac_test_frontend',
    TEST_DB_CONFIRM: 'iac_test_frontend',
    TEST_DB_MARKER_TOKEN: 'token-123',
    ...overrides,
  };
}

interface FakeOptions {
  readonly database?: string;
  readonly role?: string;
  readonly isSuperuser?: boolean;
  readonly markerToken?: string | null;
  readonly markerError?: boolean;
}

function fakePool(options: FakeOptions = {}): Pool {
  const {
    database = 'iac_test_frontend',
    role = 'iac_test_app',
    isSuperuser = false,
    markerToken = 'token-123',
    markerError = false,
  } = options;

  return {
    query: vi.fn((sql: string) => {
      if (sql.includes('current_database')) {
        return Promise.resolve({
          rows: [{ database, role, is_superuser: isSuperuser }],
        });
      }

      if (sql.includes('test_guard.marker')) {
        if (markerError) {
          return Promise.reject(new Error('missing marker'));
        }

        return Promise.resolve({
          rows: markerToken === null ? [] : [{ token: markerToken }],
        });
      }

      return Promise.reject(new Error('unexpected query'));
    }),
  } as unknown as Pool;
}

describe('assertDestructiveTestDatabase', () => {
  it('accepts a confirmed disposable database with marker', async () => {
    await expect(
      assertDestructiveTestDatabase(fakePool(), baseEnv()),
    ).resolves.toBeUndefined();
  });

  it('rejects when integration is not explicitly requested', async () => {
    await expect(
      assertDestructiveTestDatabase(
        fakePool(),
        baseEnv({ RUN_DB_INTEGRATION: undefined }),
      ),
    ).rejects.toThrow('RUN_DB_INTEGRATION=1');
  });

  it('rejects without the destructive opt-in', async () => {
    await expect(
      assertDestructiveTestDatabase(
        fakePool(),
        baseEnv({ DESTRUCTIVE_DB_TESTS: undefined }),
      ),
    ).rejects.toThrow('DESTRUCTIVE_DB_TESTS=1');
  });

  it('rejects a database name outside the exclusive prefix', async () => {
    await expect(
      assertDestructiveTestDatabase(
        fakePool(),
        baseEnv({ DB_NAME: 'iac_prod', TEST_DB_CONFIRM: 'iac_prod' }),
      ),
    ).rejects.toThrow('iac_test_');
  });

  it('rejects when TEST_DB_CONFIRM does not match DB_NAME', async () => {
    await expect(
      assertDestructiveTestDatabase(
        fakePool(),
        baseEnv({ TEST_DB_CONFIRM: 'otra_base' }),
      ),
    ).rejects.toThrow('TEST_DB_CONFIRM');
  });

  it('rejects when the connected database is not the confirmed one', async () => {
    await expect(
      assertDestructiveTestDatabase(
        fakePool({ database: 'iac_test_other' }),
        baseEnv(),
      ),
    ).rejects.toThrow('not the confirmed test database');
  });

  it('rejects a superuser role', async () => {
    await expect(
      assertDestructiveTestDatabase(fakePool({ isSuperuser: true }), baseEnv()),
    ).rejects.toThrow('must not use a superuser role');
  });

  it('rejects without a marker token', async () => {
    await expect(
      assertDestructiveTestDatabase(
        fakePool(),
        baseEnv({ TEST_DB_MARKER_TOKEN: undefined }),
      ),
    ).rejects.toThrow('TEST_DB_MARKER_TOKEN');
  });

  it('rejects when the marker is missing, unreadable or mismatched', async () => {
    await expect(
      assertDestructiveTestDatabase(
        fakePool({ markerToken: null }),
        baseEnv(),
      ),
    ).rejects.toThrow('marker token does not match');

    await expect(
      assertDestructiveTestDatabase(fakePool({ markerError: true }), baseEnv()),
    ).rejects.toThrow('missing or unreadable');

    await expect(
      assertDestructiveTestDatabase(
        fakePool({ markerToken: 'other-token' }),
        baseEnv(),
      ),
    ).rejects.toThrow('marker token does not match');
  });

  it('never issues a DELETE statement', async () => {
    const pool = fakePool();
    await assertDestructiveTestDatabase(pool, baseEnv());

    const queries = (pool.query as unknown as { mock: { calls: unknown[][] } }).mock
      .calls;
    expect(queries.every(([sql]) => !String(sql).match(/\bdelete\b/i))).toBe(true);
  });
});
