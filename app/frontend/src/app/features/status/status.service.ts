import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { catchError, forkJoin, map, of, type Observable } from 'rxjs';

import { API_BASE_URL } from '../../core/api.config';
import { toApiFailure } from '../../core/http/api-error-mapper';
import { withApiTimeout } from '../../core/http/api-timeout';
import {
  isApiHealth,
  isApiInfo,
  isDegradedHealth,
  isHealthyHealth,
} from '../../core/http/runtime-guards';
import type { ApiHealth } from '../../core/models/api-health.model';
import type { ApiInfo } from '../../core/models/api-info.model';
import type { ApiResult } from '../../core/models/api-result.model';

export interface StatusSnapshot {
  readonly info: ApiResult<ApiInfo>;
  readonly health: ApiResult<ApiHealth>;
}

@Injectable({ providedIn: 'root' })
export class StatusService {
  private readonly http = inject(HttpClient);

  load(): Observable<StatusSnapshot> {
    return forkJoin({
      info: this.getInfo(),
      health: this.getHealth(),
    });
  }

  getInfo(): Observable<ApiResult<ApiInfo>> {
    return this.http.get<unknown>(`${API_BASE_URL}/info`).pipe(
      withApiTimeout(),
      map((body): ApiResult<ApiInfo> =>
        isApiInfo(body)
          ? { ok: true, value: body }
          : {
              ok: false,
              failure: {
                kind: 'invalid-response',
                message: 'La respuesta de /api/info no cumple el contrato.',
              },
            },
      ),
      catchError((error: unknown) =>
        of({ ok: false as const, failure: toApiFailure(error) }),
      ),
    );
  }

  getHealth(): Observable<ApiResult<ApiHealth>> {
    return this.http.get<unknown>(`${API_BASE_URL}/health`).pipe(
      withApiTimeout(),
      map((body): ApiResult<ApiHealth> => {
        if (!isApiHealth(body) || !isHealthyHealth(body)) {
          return {
            ok: false,
            failure: {
              kind: 'invalid-response',
              message: 'La respuesta de /api/health no cumple el contrato.',
            },
          };
        }

        return { ok: true, value: body };
      }),
      catchError((error: unknown) => {
        if (
          error instanceof HttpErrorResponse &&
          error.status === 503 &&
          isApiHealth(error.error) &&
          isDegradedHealth(error.error)
        ) {
          return of({ ok: true as const, value: error.error });
        }

        return of({ ok: false as const, failure: toApiFailure(error) });
      }),
    );
  }
}
