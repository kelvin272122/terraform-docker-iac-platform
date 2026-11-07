import { Pool } from 'pg';
import request from 'supertest';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { createApp } from '../src/app.js';
import { loadConfig } from '../src/config/env.js';
import { createPool } from '../src/db/pool.js';
import { createRecordsRepository } from '../src/records/records.repository.js';
import { createRecordsService } from '../src/records/records.service.js';
import { assertDestructiveTestDatabase } from './destructive-db-guard.js';
import { testConfig } from './test-config.js';

const integration = process.env.RUN_DB_INTEGRATION === '1' ? describe : describe.skip;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

integration('records integration', () => {
  let pool: Pool;
  let app: ReturnType<typeof createApp>;

  beforeAll(async () => {
    const config = loadConfig();
    pool = createPool(config.database);
    await assertDestructiveTestDatabase(pool);
    const recordsService = createRecordsService(createRecordsRepository(pool));
    app = createApp(config, {
      checkDatabase: async () => 'up',
      recordsService,
    });
  });

  beforeEach(async () => {
    await assertDestructiveTestDatabase(pool);
    await pool.query('DELETE FROM records');
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  afterAll(async () => {
    await pool.end();
  });

  it('returns an empty list and total 0', async () => {
    const response = await request(app).get('/api/records');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ items: [], total: 0 });
  });

  it('creates a record and returns it in the listing', async () => {
    const created = await request(app)
      .post('/api/records')
      .send({ title: 'Prueba', description: 'Texto' });

    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({
      title: 'Prueba',
      description: 'Texto',
    });
    expect(created.body.id).toMatch(UUID_PATTERN);
    expect(new Date(created.body.createdAt).toISOString()).toBe(
      created.body.createdAt,
    );

    const list = await request(app).get('/api/records');

    expect(list.status).toBe(200);
    expect(list.body.total).toBe(1);
    expect(list.body.items).toEqual([created.body]);
  });

  it('normalizes omitted, null, empty and whitespace descriptions to null', async () => {
    const cases = [
      { title: 'Omitida' },
      { title: 'Nula', description: null },
      { title: 'Vacía', description: '' },
      { title: 'Espacios', description: '   ' },
    ];

    for (const body of cases) {
      const response = await request(app).post('/api/records').send(body);
      expect(response.status).toBe(201);
      expect(response.body.description).toBeNull();
    }

    const withText = await request(app)
      .post('/api/records')
      .send({ title: 'Texto', description: '  contenido  ' });

    expect(withText.status).toBe(201);
    expect(withText.body.description).toBe('contenido');
  });

  it('trims the title', async () => {
    const response = await request(app)
      .post('/api/records')
      .send({ title: '  Hola  ' });

    expect(response.status).toBe(201);
    expect(response.body.title).toBe('Hola');
  });

  it('accepts the maximum lengths and rejects the next character', async () => {
    const validTitle = await request(app)
      .post('/api/records')
      .send({ title: 'a'.repeat(100) });
    const invalidTitle = await request(app)
      .post('/api/records')
      .send({ title: 'a'.repeat(101) });
    const validDescription = await request(app)
      .post('/api/records')
      .send({ title: 'Descripción', description: 'b'.repeat(500) });
    const invalidDescription = await request(app)
      .post('/api/records')
      .send({ title: 'Descripción', description: 'b'.repeat(501) });

    expect(validTitle.status).toBe(201);
    expect(invalidTitle.status).toBe(400);
    expect(validDescription.status).toBe(201);
    expect(invalidDescription.status).toBe(400);
  });

  it('counts Unicode code points consistently with PostgreSQL', async () => {
    const hundredEmoji = '\u{1F600}'.repeat(100);
    const hundredOneEmoji = '\u{1F600}'.repeat(101);
    const mixed = `${'a'.repeat(99)}\u{1F600}`;

    const validTitle = await request(app)
      .post('/api/records')
      .send({ title: hundredEmoji });
    const invalidTitle = await request(app)
      .post('/api/records')
      .send({ title: hundredOneEmoji });
    const mixedTitle = await request(app)
      .post('/api/records')
      .send({ title: mixed });
    const validDescription = await request(app)
      .post('/api/records')
      .send({ title: 'Unicode', description: '\u{1F600}'.repeat(500) });
    const invalidDescription = await request(app)
      .post('/api/records')
      .send({ title: 'Unicode', description: '\u{1F600}'.repeat(501) });

    expect(validTitle.status).toBe(201);
    expect(validTitle.body.title).toBe(hundredEmoji);
    expect(invalidTitle.status).toBe(400);
    expect(mixedTitle.status).toBe(201);
    expect(validDescription.status).toBe(201);
    expect(invalidDescription.status).toBe(400);
  });

  it('rejects invalid types, unknown fields and non-object bodies', async () => {
    const invalidBodies = [
      { title: 42 },
      { title: 'Prueba', description: 42 },
      { title: 'Prueba', id: '00000000-0000-4000-8000-000000000001' },
      { title: 'Prueba', createdAt: '2026-01-01T00:00:00Z' },
      { title: 'Prueba', extra: true },
      { title: '   ' },
      { title: 'a\u0000b' },
      { title: 'Prueba', description: 'a\u0000b' },
    ];

    for (const body of invalidBodies) {
      const response = await request(app).post('/api/records').send(body);
      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    }

    const arrayBody = await request(app).post('/api/records').send([]);
    const primitiveBody = await request(app)
      .post('/api/records')
      .set('Content-Type', 'application/json')
      .send('null');

    expect(arrayBody.status).toBe(400);
    expect(primitiveBody.status).toBe(400);
  });

  it('allows repeated titles', async () => {
    const first = await request(app)
      .post('/api/records')
      .send({ title: 'Repetido' });
    const second = await request(app)
      .post('/api/records')
      .send({ title: 'Repetido' });

    expect(first.status).toBe(201);
    expect(second.status).toBe(201);

    const list = await request(app).get('/api/records');
    expect(list.body.total).toBe(2);
  });

  it('orders by created_at DESC and id DESC for ties', async () => {
    const sameTimestamp = '2026-01-01T00:00:00Z';
    const older = '2025-01-01T00:00:00Z';
    const newer = '2027-01-01T00:00:00Z';

    await pool.query(
      `INSERT INTO records (id, title, created_at)
       VALUES ($1, $2, $3), ($4, $5, $3), ($6, $7, $8)`,
      [
        '00000000-0000-4000-8000-000000000001',
        'A',
        sameTimestamp,
        '00000000-0000-4000-8000-000000000002',
        'B',
        '00000000-0000-4000-8000-000000000003',
        'C',
        older,
      ],
    );

    await pool.query(
      'INSERT INTO records (id, title, created_at) VALUES ($1, $2, $3)',
      ['00000000-0000-4000-8000-000000000004', 'D', newer],
    );

    const response = await request(app).get('/api/records');

    expect(response.status).toBe(200);
    expect(response.body.items.map((item: { id: string }) => item.id)).toEqual([
      '00000000-0000-4000-8000-000000000004',
      '00000000-0000-4000-8000-000000000002',
      '00000000-0000-4000-8000-000000000001',
      '00000000-0000-4000-8000-000000000003',
    ]);
    expect(response.body.total).toBe(response.body.items.length);
  });

  it('keeps total equal to the number of returned items', async () => {
    for (const title of ['Uno', 'Dos', 'Tres']) {
      const response = await request(app).post('/api/records').send({ title });
      expect(response.status).toBe(201);
    }

    const response = await request(app).get('/api/records');

    expect(response.body.total).toBe(3);
    expect(response.body.items).toHaveLength(3);
  });

  it('deletes a record with 204 and no body, then returns 404 on repetition', async () => {
    const created = await request(app)
      .post('/api/records')
      .send({ title: 'Eliminar' });
    const id = created.body.id as string;

    const deleted = await request(app).delete(`/api/records/${id}`);

    expect(deleted.status).toBe(204);
    expect(deleted.text).toBe('');

    const list = await request(app).get('/api/records');
    expect(list.body.total).toBe(0);

    const repeated = await request(app).delete(`/api/records/${id}`);
    expect(repeated.status).toBe(404);
    expect(repeated.body.error.code).toBe('RECORD_NOT_FOUND');
  });

  it('rejects invalid UUIDs and valid nonexistent UUIDs', async () => {
    const invalid = await request(app).delete('/api/records/not-a-uuid');
    const nonexistent = await request(app).delete(
      '/api/records/00000000-0000-4000-8000-000000000099',
    );

    expect(invalid.status).toBe(400);
    expect(invalid.body.error.code).toBe('VALIDATION_ERROR');
    expect(nonexistent.status).toBe(404);
    expect(nonexistent.body.error.code).toBe('RECORD_NOT_FOUND');
  });

  it('treats SQL-looking text as ordinary data', async () => {
    const title = "'; DROP TABLE records; --";

    const created = await request(app).post('/api/records').send({ title });
    expect(created.status).toBe(201);
    expect(created.body.title).toBe(title);

    const list = await request(app).get('/api/records');
    expect(list.status).toBe(200);
    expect(list.body.items[0]?.title).toBe(title);

    const after = await request(app)
      .post('/api/records')
      .send({ title: 'Después' });
    expect(after.status).toBe(201);
  });

  it('returns 503 without internal details when the database is unavailable', async () => {
    const unavailablePool = new Pool({
      host: '127.0.0.1',
      port: 1,
      database: 'unavailable',
      user: 'unavailable',
      password: 'unavailable',
      connectionTimeoutMillis: 300,
      query_timeout: 300,
    });
    const unavailableService = createRecordsService(
      createRecordsRepository(unavailablePool),
    );
    const unavailableApp = createApp(testConfig, {
      checkDatabase: async () => 'down',
      recordsService: unavailableService,
    });

    const response = await request(unavailableApp).get('/api/records');

    expect(response.status).toBe(503);
    expect(response.body).toEqual({
      error: {
        code: 'DATABASE_UNAVAILABLE',
        message: 'La base de datos no está disponible.',
      },
    });
    expect(JSON.stringify(response.body)).not.toMatch(
      /ECONNREFUSED|password|select|127\.0\.0\.1|stack/i,
    );

    await unavailablePool.end();

    const recovered = await request(app).get('/api/records');
    expect(recovered.status).toBe(200);
  });
});
