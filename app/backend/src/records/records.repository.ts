import { randomUUID } from 'node:crypto';

import type { Pool } from 'pg';

import { ApiError } from '../api/errors.js';
import type { CreateRecordInput, RecordItem, RecordsList } from './records.model.js';

export interface RecordsRepository {
  list(): Promise<RecordsList>;
  create(input: CreateRecordInput): Promise<RecordItem>;
  remove(id: string): Promise<boolean>;
}

interface RecordRow {
  readonly id: string;
  readonly title: string;
  readonly description: string | null;
  readonly created_at: Date | string;
  readonly total?: string | number;
}

const SELECT_COLUMNS = 'id, title, description, created_at';

const NODE_CONNECTION_CODES = new Set([
  'ECONNREFUSED',
  'ECONNRESET',
  'ETIMEDOUT',
  'ENOTFOUND',
  'EHOSTUNREACH',
  'EAI_AGAIN',
  'EPIPE',
]);

const DATABASE_UNAVAILABLE_CODES = new Set([
  '57P01',
  '57P02',
  '57P03',
  '53300',
  '53400',
]);

export function createRecordsRepository(pool: Pool): RecordsRepository {
  return {
    async list(): Promise<RecordsList> {
      return withDatabaseErrors(async () => {
        const result = await pool.query<RecordRow>(
          `SELECT ${SELECT_COLUMNS}, count(*) OVER() AS total
             FROM records
            ORDER BY created_at DESC, id DESC`,
        );

        const items = result.rows.map(mapRow);
        const total = result.rows[0]?.total;

        return {
          items,
          total: total === undefined ? items.length : Number(total),
        };
      });
    },

    async create(input: CreateRecordInput): Promise<RecordItem> {
      return withDatabaseErrors(async () => {
        const result = await pool.query<RecordRow>(
          `INSERT INTO records (id, title, description)
           VALUES ($1, $2, $3)
           RETURNING ${SELECT_COLUMNS}`,
          [randomUUID(), input.title, input.description],
        );

        const row = result.rows[0];
        if (!row) {
          throw new Error('La inserción no devolvió el registro creado.');
        }

        return mapRow(row);
      });
    },

    async remove(id: string): Promise<boolean> {
      return withDatabaseErrors(async () => {
        const result = await pool.query('DELETE FROM records WHERE id = $1', [id]);
        return (result.rowCount ?? 0) > 0;
      });
    },
  };
}

export function isDatabaseUnavailable(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const code = (error as { code?: unknown }).code;

  if (typeof code === 'string') {
    if (code.startsWith('08')) {
      return true;
    }

    if (DATABASE_UNAVAILABLE_CODES.has(code) || NODE_CONNECTION_CODES.has(code)) {
      return true;
    }
  }

  const message = error.message.toLowerCase();

  return (
    message.includes('timeout exceeded when trying to connect') ||
    message.includes('connection terminated') ||
    message.includes('connection refused') ||
    message.includes('client has encountered a connection error')
  );
}

async function withDatabaseErrors<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (isDatabaseUnavailable(error)) {
      throw ApiError.databaseUnavailable();
    }

    throw error;
  }
}

function mapRow(row: RecordRow): RecordItem {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    createdAt: toIsoString(row.created_at),
  };
}

function toIsoString(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}
