import type { ApiErrorCode } from '../models/api-error.model';
import type { ApiHealth } from '../models/api-health.model';
import type { ApiInfo } from '../models/api-info.model';
import type { RecordItem, RecordsList } from '../models/record.model';

const KNOWN_ERROR_CODES = new Set<ApiErrorCode>([
  'VALIDATION_ERROR',
  'NOT_FOUND',
  'RECORD_NOT_FOUND',
  'PAYLOAD_TOO_LARGE',
  'DATABASE_UNAVAILABLE',
  'INTERNAL_ERROR',
  'API_NOT_CONFIGURED',
]);

export function isApiInfo(value: unknown): value is ApiInfo {
  if (!isRecord(value)) {
    return false;
  }

  return (
    (value['environment'] === 'dev' || value['environment'] === 'prod') &&
    isNonEmptyString(value['apiVersion']) &&
    isNonEmptyString(value['appVersion']) &&
    isNonEmptyString(value['instanceId'])
  );
}

export function isApiHealth(value: unknown): value is ApiHealth {
  if (!isRecord(value)) {
    return false;
  }

  return (
    (value['status'] === 'ok' || value['status'] === 'degraded') &&
    value['api'] === 'up' &&
    (value['database'] === 'up' || value['database'] === 'down') &&
    isIsoDate(value['checkedAt'])
  );
}

export function isHealthyHealth(value: ApiHealth): boolean {
  return value.status === 'ok' && value.database === 'up';
}

export function isDegradedHealth(value: ApiHealth): boolean {
  return value.status === 'degraded' && value.database === 'down';
}

export function isRecordItem(value: unknown): value is RecordItem {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isNonEmptyString(value['id']) &&
    typeof value['title'] === 'string' &&
    (value['description'] === null || typeof value['description'] === 'string') &&
    isIsoDate(value['createdAt'])
  );
}

export function isRecordsList(value: unknown): value is RecordsList {
  if (!isRecord(value)) {
    return false;
  }

  const items = value['items'];
  const total = value['total'];

  if (!Array.isArray(items) || !items.every(isRecordItem)) {
    return false;
  }

  return (
    typeof total === 'number' &&
    Number.isInteger(total) &&
    total >= 0 &&
    total === items.length
  );
}

export interface ParsedApiError {
  readonly code?: ApiErrorCode;
  readonly message: string;
  readonly fields?: Readonly<Record<string, string>>;
}

export function parseApiErrorBody(value: unknown): ParsedApiError | null {
  if (!isRecord(value) || !isRecord(value['error'])) {
    return null;
  }

  const error = value['error'];
  const code = error['code'];
  const message = error['message'];
  const fields = error['fields'];

  if (typeof code !== 'string' || typeof message !== 'string') {
    return null;
  }

  const normalizedCode = KNOWN_ERROR_CODES.has(code as ApiErrorCode)
    ? (code as ApiErrorCode)
    : undefined;

  if (fields !== undefined && !isStringRecord(fields)) {
    return null;
  }

  return {
    ...(normalizedCode ? { code: normalizedCode } : {}),
    message,
    ...(fields ? { fields } : {}),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isStringRecord(value: unknown): value is Record<string, string> {
  return (
    isRecord(value) &&
    Object.values(value).every((entry) => typeof entry === 'string')
  );
}

function isIsoDate(value: unknown): value is string {
  if (typeof value !== 'string') {
    return false;
  }

  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date.toISOString() === value;
}
