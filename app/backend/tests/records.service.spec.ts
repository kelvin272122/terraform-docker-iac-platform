import { describe, expect, it, vi } from 'vitest';

import type { RecordItem, RecordsList } from '../src/records/records.model.js';
import type { RecordsRepository } from '../src/records/records.repository.js';
import { createRecordsService } from '../src/records/records.service.js';

const createdRecord: RecordItem = {
  id: '00000000-0000-4000-8000-000000000001',
  title: 'Prueba',
  description: null,
  createdAt: '2026-01-01T00:00:00.000Z',
};

function createRepository(overrides: Partial<RecordsRepository> = {}): RecordsRepository {
  return {
    list: vi.fn(async (): Promise<RecordsList> => ({ items: [], total: 0 })),
    create: vi.fn(async (): Promise<RecordItem> => createdRecord),
    remove: vi.fn(async (): Promise<boolean> => true),
    ...overrides,
  };
}

describe('createRecordsService', () => {
  it('delegates the listing to the repository', async () => {
    const list: RecordsList = { items: [createdRecord], total: 1 };
    const repository = createRepository({ list: vi.fn(async () => list) });
    const service = createRecordsService(repository);

    await expect(service.list()).resolves.toEqual(list);
    expect(repository.list).toHaveBeenCalledTimes(1);
  });

  it('validates and normalizes before creating', async () => {
    const repository = createRepository();
    const service = createRecordsService(repository);

    await service.create({ title: '  Prueba  ', description: '  Texto  ' });

    expect(repository.create).toHaveBeenCalledWith({
      title: 'Prueba',
      description: 'Texto',
    });
  });

  it('does not call the repository when creation is invalid', async () => {
    const repository = createRepository();
    const service = createRecordsService(repository);

    await expect(service.create({ title: '   ' })).rejects.toMatchObject({
      status: 400,
      code: 'VALIDATION_ERROR',
      fields: { title: expect.any(String) },
    });
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('rejects an invalid UUID without querying the repository', async () => {
    const repository = createRepository();
    const service = createRecordsService(repository);

    await expect(service.remove('not-a-uuid')).rejects.toMatchObject({
      status: 400,
      code: 'VALIDATION_ERROR',
    });
    expect(repository.remove).not.toHaveBeenCalled();
  });

  it('accepts canonical non-v4 UUIDs and normalizes case', async () => {
    const repository = createRepository();
    const service = createRecordsService(repository);

    await service.remove('00000000-0000-1000-8000-000000000001');
    await service.remove('AAAAAAAA-AAAA-4AAA-8AAA-AAAAAAAAAAAA');

    expect(repository.remove).toHaveBeenNthCalledWith(
      1,
      '00000000-0000-1000-8000-000000000001',
    );
    expect(repository.remove).toHaveBeenNthCalledWith(
      2,
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    );
  });

  it('returns RECORD_NOT_FOUND when nothing was deleted', async () => {
    const repository = createRepository({ remove: vi.fn(async () => false) });
    const service = createRecordsService(repository);

    await expect(
      service.remove('00000000-0000-4000-8000-000000000099'),
    ).rejects.toMatchObject({
      status: 404,
      code: 'RECORD_NOT_FOUND',
    });
  });

  it('resolves when the record was deleted', async () => {
    const repository = createRepository();
    const service = createRecordsService(repository);

    await expect(
      service.remove('00000000-0000-4000-8000-000000000001'),
    ).resolves.toBeUndefined();
    expect(repository.remove).toHaveBeenCalledWith(
      '00000000-0000-4000-8000-000000000001',
    );
  });
});
