import type { ErrorRequestHandler } from 'express';

import { ApiError, type ApiErrorCode } from '../api/errors.js';

interface RequestBodyError extends Error {
  readonly type?: string;
  readonly status?: number;
}

interface ErrorResult {
  readonly status: number;
  readonly code: ApiErrorCode;
  readonly message: string;
  readonly fields?: Record<string, string>;
}

export const errorHandler: ErrorRequestHandler = (error, request, response, next) => {
  if (response.headersSent) {
    next(error);
    return;
  }

  const result = classifyError(error);

  console.error(
    JSON.stringify({
      level: 'error',
      message: 'request failed',
      method: request.method,
      path: request.path,
      status: result.status,
      code: result.code,
      errorName: error instanceof Error ? error.name : 'UnknownError',
      databaseCode: getDatabaseCode(error),
    }),
  );

  response.status(result.status).json({
    error: {
      code: result.code,
      message: result.message,
      ...(result.fields ? { fields: result.fields } : {}),
    },
  });
};

function classifyError(error: unknown): ErrorResult {
  if (error instanceof ApiError) {
    return {
      status: error.status,
      code: error.code,
      message: error.message,
      fields: error.fields,
    };
  }

  const requestBodyError = error as RequestBodyError;

  if (requestBodyError.type === 'entity.parse.failed') {
    return {
      status: 400,
      code: 'VALIDATION_ERROR',
      message: 'El cuerpo JSON no es válido.',
    };
  }

  if (requestBodyError.type === 'entity.too.large') {
    return {
      status: 413,
      code: 'PAYLOAD_TOO_LARGE',
      message: 'El cuerpo de la solicitud supera el límite permitido.',
    };
  }

  if (
    typeof requestBodyError.status === 'number' &&
    requestBodyError.status >= 400 &&
    requestBodyError.status < 500
  ) {
    return {
      status: 400,
      code: 'VALIDATION_ERROR',
      message: 'La solicitud no es válida.',
    };
  }

  return {
    status: 500,
    code: 'INTERNAL_ERROR',
    message: 'Ocurrió un error interno.',
  };
}

function getDatabaseCode(error: unknown): string | undefined {
  const code = (error as { code?: unknown }).code;
  return typeof code === 'string' && /^[0-9A-Z]{5}$/.test(code) ? code : undefined;
}
