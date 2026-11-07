export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'RECORD_NOT_FOUND'
  | 'PAYLOAD_TOO_LARGE'
  | 'DATABASE_UNAVAILABLE'
  | 'INTERNAL_ERROR'
  | 'API_NOT_CONFIGURED';

export interface ApiErrorBody {
  readonly error: {
    readonly code: ApiErrorCode;
    readonly message: string;
    readonly fields?: Readonly<Record<string, string>>;
  };
}

export type ApiFailureKind = 'http' | 'network' | 'timeout' | 'invalid-response';

export interface ApiFailure {
  readonly kind: ApiFailureKind;
  readonly status?: number;
  readonly code?: ApiErrorCode;
  readonly message: string;
  readonly fields?: Readonly<Record<string, string>>;
}
