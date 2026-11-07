import {
  isApiHealth,
  isApiInfo,
  isRecordItem,
  isRecordsList,
  parseApiErrorBody,
} from './runtime-guards';

const createdAt = '2026-11-07T18:30:00.000Z';

describe('runtime guards', () => {
  it('validates the info contract', () => {
    expect(
      isApiInfo({
        environment: 'dev',
        apiVersion: 'v1',
        appVersion: '0.1.0',
        instanceId: 'api-1',
      }),
    ).toBe(true);

    expect(
      isApiInfo({
        environment: 'test',
        apiVersion: 'v1',
        appVersion: '0.1.0',
        instanceId: 'api-1',
      }),
    ).toBe(false);
  });

  it('validates the health contract and ISO dates', () => {
    expect(
      isApiHealth({
        status: 'ok',
        api: 'up',
        database: 'up',
        checkedAt: createdAt,
      }),
    ).toBe(true);

    expect(
      isApiHealth({
        status: 'ok',
        api: 'up',
        database: 'up',
        checkedAt: 'ayer',
      }),
    ).toBe(false);
  });

  it('validates records and keeps total consistent', () => {
    const record = {
      id: '00000000-0000-4000-8000-000000000001',
      title: 'Prueba',
      description: null,
      createdAt,
    };

    expect(isRecordItem(record)).toBe(true);
    expect(isRecordsList({ items: [record], total: 1 })).toBe(true);
    expect(isRecordsList({ items: [record], total: 2 })).toBe(false);
    expect(isRecordsList({ items: [{ ...record, createdAt: 'x' }], total: 1 })).toBe(
      false,
    );
  });

  it('parses the approved error envelope without trusting unknown codes', () => {
    expect(
      parseApiErrorBody({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Revisa los datos.',
          fields: { title: 'Obligatorio.' },
        },
      }),
    ).toEqual({
      code: 'VALIDATION_ERROR',
      message: 'Revisa los datos.',
      fields: { title: 'Obligatorio.' },
    });

    expect(
      parseApiErrorBody({
        error: { code: 'ALGO_DESCONOCIDO', message: 'Error.' },
      }),
    ).toEqual({ message: 'Error.' });

    expect(parseApiErrorBody('texto')).toBeNull();
  });
});
