import { ApiError } from '../api/errors.js';
import type { CreateRecordInput } from './records.model.js';

export const TITLE_MAX_LENGTH = 100;
export const DESCRIPTION_MAX_LENGTH = 500;

const ALLOWED_FIELDS = new Set(['title', 'description']);

export function parseCreateRecordBody(body: unknown): CreateRecordInput {
  if (!isJsonObject(body)) {
    throw ApiError.validation('El cuerpo debe ser un objeto JSON.');
  }

  const fields: Record<string, string> = {};

  for (const key of Object.keys(body)) {
    if (!ALLOWED_FIELDS.has(key)) {
      fields[key] = 'Campo no permitido.';
    }
  }

  const title = parseTitle(body.title, fields);
  const description = parseDescription(body.description, fields);

  if (Object.keys(fields).length > 0) {
    throw ApiError.validation('Revisa los datos enviados.', fields);
  }

  return { title: title as string, description };
}

function parseTitle(value: unknown, fields: Record<string, string>): string | undefined {
  if (value === undefined) {
    fields.title = 'El título es obligatorio.';
    return undefined;
  }

  if (typeof value !== 'string') {
    fields.title = 'El título debe ser una cadena de texto.';
    return undefined;
  }

  const trimmed = value.trim();
  if (trimmed === '') {
    fields.title = 'El título es obligatorio.';
    return undefined;
  }

  if (trimmed.includes('\u0000')) {
    fields.title = 'El título contiene un carácter no válido.';
    return undefined;
  }

  if (codePointLength(trimmed) > TITLE_MAX_LENGTH) {
    fields.title = `El título no puede superar los ${TITLE_MAX_LENGTH} caracteres.`;
    return undefined;
  }

  return trimmed;
}

function parseDescription(
  value: unknown,
  fields: Record<string, string>,
): string | null {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== 'string') {
    fields.description = 'La descripción debe ser una cadena de texto o null.';
    return null;
  }

  const trimmed = value.trim();
  if (trimmed === '') {
    return null;
  }

  if (trimmed.includes('\u0000')) {
    fields.description = 'La descripción contiene un carácter no válido.';
    return null;
  }

  if (codePointLength(trimmed) > DESCRIPTION_MAX_LENGTH) {
    fields.description = `La descripción no puede superar los ${DESCRIPTION_MAX_LENGTH} caracteres.`;
    return null;
  }

  return trimmed;
}

function codePointLength(value: string): number {
  return Array.from(value).length;
}

function isJsonObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
