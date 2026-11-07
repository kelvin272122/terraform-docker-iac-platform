import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { catchError, map, of, type Observable } from 'rxjs';

import { API_BASE_URL } from '../../core/api.config';
import { toApiFailure } from '../../core/http/api-error-mapper';
import { withApiTimeout } from '../../core/http/api-timeout';
import { isRecordItem, isRecordsList } from '../../core/http/runtime-guards';
import type { ApiResult } from '../../core/models/api-result.model';
import type {
  CreateRecordInput,
  RecordItem,
  RecordsList,
} from '../../core/models/record.model';

@Injectable({ providedIn: 'root' })
export class RecordsService {
  private readonly http = inject(HttpClient);

  list(): Observable<ApiResult<RecordsList>> {
    return this.http.get<unknown>(`${API_BASE_URL}/records`).pipe(
      withApiTimeout(),
      map((body): ApiResult<RecordsList> =>
        isRecordsList(body)
          ? { ok: true, value: body }
          : {
              ok: false,
              failure: {
                kind: 'invalid-response',
                message: 'La respuesta del listado no cumple el contrato.',
              },
            },
      ),
      catchError((error: unknown) =>
        of({ ok: false as const, failure: toApiFailure(error) }),
      ),
    );
  }

  create(input: CreateRecordInput): Observable<ApiResult<RecordItem>> {
    return this.http.post<unknown>(`${API_BASE_URL}/records`, input).pipe(
      withApiTimeout(),
      map((body): ApiResult<RecordItem> =>
        isRecordItem(body)
          ? { ok: true, value: body }
          : {
              ok: false,
              failure: {
                kind: 'invalid-response',
                message: 'La respuesta de creación no cumple el contrato.',
              },
            },
      ),
      catchError((error: unknown) =>
        of({ ok: false as const, failure: toApiFailure(error) }),
      ),
    );
  }

  remove(id: string): Observable<ApiResult<void>> {
    return this.http
      .delete<unknown>(`${API_BASE_URL}/records/${encodeURIComponent(id)}`)
      .pipe(
        withApiTimeout(),
        map(() => ({ ok: true as const, value: undefined })),
        catchError((error: unknown) =>
          of({ ok: false as const, failure: toApiFailure(error) }),
        ),
      );
  }
}
