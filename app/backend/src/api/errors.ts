export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'RECORD_NOT_FOUND'
  | 'PAYLOAD_TOO_LARGE'
  | 'DATABASE_UNAVAILABLE'
  | 'INTERNAL_ERROR';

export interface ApiErrorBody {
  readonly error: {
    readonly code: ApiErrorCode;
    readonly message: string;
    readonly fields?: Record<string, string>;
  };
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: ApiErrorCode;
  readonly fields?: Record<string, string>;

  constructor(
    status: number,
    code: ApiErrorCode,
    message: string,
    fields?: Record<string, string>,
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.fields = fields;
  }

  static validation(message: string, fields?: Record<string, string>): ApiError {
    return new ApiError(400, 'VALIDATION_ERROR', message, fields);
  }

  static recordNotFound(): ApiError {
    return new ApiError(404, 'RECORD_NOT_FOUND', 'El registro no existe.');
  }

  static databaseUnavailable(): ApiError {
    return new ApiError(503, 'DATABASE_UNAVAILABLE', 'La base de datos no está disponible.');
  }
}
