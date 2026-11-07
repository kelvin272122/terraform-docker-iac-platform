import type { Pool } from 'pg';
import { describe, expect, it, vi } from 'vitest';

import { ApiError } from '../src/api/errors.js';
import {
  createRecordsRepository,
  isDatabaseUnavailable,
} from '../src/records/records.repository.js';

function fakePool(query: (...args: unknown[]) => Promise<unknown>): Pool {
  return { query } as unknown as Pool;
}

describe('isDatabaseUnavailable', () => {
  it.each([
    ['ECONNREFUSED'],
    ['ECONNRESET'],
    ['ETIMEDOUT'],
    ['ENOTFOUND'],
    ['EHOSTUNREACH'],
    ['EAI_AGAIN'],
    ['EPIPE'],
    ['08006'],
    ['57P01'],
    ['57P02'],
    ['57P03'],
    ['53300'],
    ['53400'],
  ])('recognizes %s as unavailable', (code) => {
    expect(isDatabaseUnavailable(Object.assign(new Error('fallo'), { code }))).toBe(
      true,
    );
  });

  it.each([['23514'], ['23502'], ['22001'], ['42501'], ['42601'], ['42P01'], ['22P02']])(
    'does not treat %s as unavailable',
    (code) => {
      expect(isDatabaseUnavailable(Object.assign(new Error('fallo'), { code }))).toBe(
        false,
      );
    },
  );

  it('recognizes the pool acquisition timeout message', () => {
    expect(
      isDatabaseUnavailable(new Error('timeout exceeded when trying to connect')),
    ).toBe(true);
  });

  it('does not classify unrelated errors as unavailable', () => {
    expect(isDatabaseUnavailable(new Error('programming error'))).toBe(false);
    expect(isDatabaseUnavailable('text')).toBe(false);
  });
});

describe('createRecordsRepository', () => {
  it('lists records and total with a single query', async () => {
    const query = vi.fn().mockResolvedValue({
      rows: [
        {
          id: '00000000-0000-4000-8000-000000000002',
          title: 'B',
          description: null,
          created_at: new Date('2026-01-01T00:00:00Z'),
          total: '2',
        },
        {
          id: '00000000-0000-4000-8000-000000000001',
          title: 'A',
          description: 'texto',
          created_at: '2026-01-01T00:00:00Z',
          total: '2',
        },
      ],
    });
    const repository = createRecordsRepository(fakePool(query));

    const result = await repository.list();

    expect(query).toHaveBeenCalledTimes(1);
    expect(String(query.mock.calls[0]?.[0])).toContain('count(*) OVER()');
    expect(String(query.mock.calls[0]?.[0])).toContain(
      'ORDER BY created_at DESC, id DESC',
    );
    expect(result.total).toBe(2);
    expect(result.items).toHaveLength(2);
    expect(result.items[0]?.createdAt).toBe('2026-01-01T00:00:00.000Z');
    expect(result.items[1]?.description).toBe('texto');
  });

  it('returns total 0 when the table is empty', async () => {
    const query = vi.fn().mockResolvedValue({ rows: [] });
    const repository = createRecordsRepository(fakePool(query));

    await expect(repository.list()).resolves.toEqual({ items: [], total: 0 });
  });

  it('creates a record with a generated UUID and returns the inserted row', async () => {
    const query = vi.fn().mockResolvedValue({
      rows: [
        {
          id: '00000000-0000-4000-8000-000000000001',
          title: 'Prueba',
          description: null,
          created_at: new Date('2026-01-01T00:00:00Z'),
        },
      ],
    });
    const repository = createRecordsRepository(fakePool(query));

    const created = await repository.create({
      title: 'Prueba',
      description: null,
    });

    const parameters = query.mock.calls[0]?.[1] as unknown[];
    expect(parameters[0]).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
    expect(parameters[1]).toBe('Prueba');
    expect(parameters[2]).toBeNull();
    expect(created).toEqual({
      id: '00000000-0000-4000-8000-000000000001',
      title: 'Prueba',
      description: null,
      createdAt: '2026-01-01T00:00:00.000Z',
    });
  });

  it('reports whether a delete removed a row', async () => {
    const query = vi
      .fn()
      .mockResolvedValueOnce({ rowCount: 1 })
      .mockResolvedValueOnce({ rowCount: 0 });
    const repository = createRecordsRepository(fakePool(query));

    await expect(
      repository.remove('00000000-0000-4000-8000-000000000001'),
    ).resolves.toBe(true);
    await expect(
      repository.remove('00000000-0000-4000-8000-000000000002'),
    ).resolves.toBe(false);
  });

  it('maps connection errors to DATABASE_UNAVAILABLE', async () => {
    const query = vi
      .fn()
      .mockRejectedValue(Object.assign(new Error('fallo'), { code: 'ECONNREFUSED' }));
    const repository = createRecordsRepository(fakePool(query));

    const error = await repository.list().catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status: 503,
      code: 'DATABASE_UNAVAILABLE',
      message: 'La base de datos no está disponible.',
    });
  });

  it('does not convert constraint or programming errors into DATABASE_UNAVAILABLE', async () => {
    const constraintError = Object.assign(new Error('check violation'), {
      code: '23514',
    });
    const query = vi.fn().mockRejectedValue(constraintError);
    const repository = createRecordsRepository(fakePool(query));

    await expect(
      repository.create({ title: 'Prueba', description: null }),
    ).rejects.toBe(constraintError);
  });
});
