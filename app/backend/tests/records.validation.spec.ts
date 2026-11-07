import { describe, expect, it } from 'vitest';

import { ApiError } from '../src/api/errors.js';
import {
  DESCRIPTION_MAX_LENGTH,
  TITLE_MAX_LENGTH,
  parseCreateRecordBody,
} from '../src/records/records.validation.js';

function expectValidationError(
  body: unknown,
  field?: string,
): ApiError {
  try {
    parseCreateRecordBody(body);
  } catch (error) {
    expect(error).toBeInstanceOf(ApiError);
    const apiError = error as ApiError;
    expect(apiError.status).toBe(400);
    expect(apiError.code).toBe('VALIDATION_ERROR');
    if (field) {
      expect(apiError.fields).toHaveProperty(field);
    }
    return apiError;
  }

  throw new Error('Se esperaba un error de validación.');
}

describe('parseCreateRecordBody', () => {
  it('normalizes an omitted description to null', () => {
    expect(parseCreateRecordBody({ title: 'Prueba' })).toEqual({
      title: 'Prueba',
      description: null,
    });
  });

  it('trims the title and the description', () => {
    expect(
      parseCreateRecordBody({ title: '  Prueba  ', description: '  Texto  ' }),
    ).toEqual({
      title: 'Prueba',
      description: 'Texto',
    });
  });

  it.each([
    ['null', null],
    ['empty', ''],
    ['whitespace', '   '],
  ])('normalizes a %s description to null', (_name, description) => {
    expect(parseCreateRecordBody({ title: 'Prueba', description })).toEqual({
      title: 'Prueba',
      description: null,
    });
  });

  it('accepts the maximum title length in characters', () => {
    const title = 'a'.repeat(TITLE_MAX_LENGTH);
    expect(parseCreateRecordBody({ title }).title).toBe(title);
  });

  it('rejects a title over the maximum length', () => {
    expectValidationError({ title: 'a'.repeat(TITLE_MAX_LENGTH + 1) }, 'title');
  });

  it('accepts the maximum description length in characters', () => {
    const description = 'b'.repeat(DESCRIPTION_MAX_LENGTH);
    expect(parseCreateRecordBody({ title: 'Prueba', description })).toEqual({
      title: 'Prueba',
      description,
    });
  });

  it('rejects a description over the maximum length', () => {
    expectValidationError(
      { title: 'Prueba', description: 'b'.repeat(DESCRIPTION_MAX_LENGTH + 1) },
      'description',
    );
  });

  it('counts Unicode code points instead of UTF-16 code units', () => {
    const title = `${'a'.repeat(99)}\u{1F600}`;
    expect(title.length).toBe(101);
    expect(Array.from(title).length).toBe(100);
    expect(parseCreateRecordBody({ title }).title).toBe(title);
  });

  it('accepts 100 emoji characters and rejects 101', () => {
    expect(parseCreateRecordBody({ title: '\u{1F600}'.repeat(100) }).title).toBe(
      '\u{1F600}'.repeat(100),
    );
    expectValidationError({ title: '\u{1F600}'.repeat(101) }, 'title');
  });

  it('accepts 500 emoji characters in the description and rejects 501', () => {
    expect(
      parseCreateRecordBody({
        title: 'Prueba',
        description: '\u{1F600}'.repeat(500),
      }).description,
    ).toBe('\u{1F600}'.repeat(500));
    expectValidationError(
      { title: 'Prueba', description: '\u{1F600}'.repeat(501) },
      'description',
    );
  });

  it('rejects a missing, empty or whitespace-only title', () => {
    expectValidationError({}, 'title');
    expectValidationError({ title: '' }, 'title');
    expectValidationError({ title: '   ' }, 'title');
  });

  it.each([
    ['number', 42],
    ['boolean', true],
    ['object', {}],
    ['array', []],
  ])('rejects a %s title', (_name, title) => {
    expectValidationError({ title }, 'title');
  });

  it.each([
    ['number', 42],
    ['boolean', true],
    ['object', {}],
    ['array', []],
  ])('rejects a %s description', (_name, description) => {
    expectValidationError({ title: 'Prueba', description }, 'description');
  });

  it.each([
    ['id', { title: 'Prueba', id: '00000000-0000-4000-8000-000000000001' }],
    ['createdAt', { title: 'Prueba', createdAt: '2026-01-01T00:00:00Z' }],
    ['extra', { title: 'Prueba', extra: true }],
  ])('rejects the unknown %s field', (field, body) => {
    const error = expectValidationError(body, field);
    expect(error.fields?.[field]).toBe('Campo no permitido.');
  });

  it.each([
    ['null', null],
    ['array', []],
    ['string', 'texto'],
    ['number', 42],
    ['boolean', true],
  ])('rejects a %s body', (_name, body) => {
    expectValidationError(body);
  });

  it('accepts SQL-looking text as ordinary data', () => {
    const title = "'; DROP TABLE records; --";
    expect(parseCreateRecordBody({ title }).title).toBe(title);
  });

  it('rejects NUL characters that PostgreSQL cannot store', () => {
    expectValidationError({ title: 'a\u0000b' }, 'title');
    expectValidationError(
      { title: 'Prueba', description: 'a\u0000b' },
      'description',
    );
  });
});
