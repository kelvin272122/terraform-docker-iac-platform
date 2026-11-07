import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { StatusService, type StatusSnapshot } from './status.service';

const checkedAt = '2026-11-07T18:30:00.000Z';

describe('StatusService', () => {
  let service: StatusService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(StatusService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('requests info and health independently', async () => {
    const resultPromise = firstValueFrom(service.load());

    httpMock.expectOne('/api/info').flush({
      environment: 'dev',
      apiVersion: 'v1',
      appVersion: '0.1.0',
      instanceId: 'api-1',
    });
    httpMock.expectOne('/api/health').flush({
      status: 'ok',
      api: 'up',
      database: 'up',
      checkedAt,
    });

    const result: StatusSnapshot = await resultPromise;

    expect(result.info.ok).toBe(true);
    expect(result.health.ok).toBe(true);
  });

  it('keeps a valid health result when info fails', async () => {
    const resultPromise = firstValueFrom(service.load());

    httpMock.expectOne('/api/info').flush(
      { error: { code: 'INTERNAL_ERROR', message: 'Fallo.' } },
      { status: 500, statusText: 'Server Error' },
    );
    httpMock.expectOne('/api/health').flush({
      status: 'ok',
      api: 'up',
      database: 'up',
      checkedAt,
    });

    const result = await resultPromise;

    expect(result.info.ok).toBe(false);
    expect(result.health.ok).toBe(true);
  });

  it('accepts a valid 503 health response as database down', async () => {
    const resultPromise = firstValueFrom(service.getHealth());

    httpMock.expectOne('/api/health').flush(
      {
        status: 'degraded',
        api: 'up',
        database: 'down',
        checkedAt,
      },
      { status: 503, statusText: 'Service Unavailable' },
    );

    const result = await resultPromise;

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.database).toBe('down');
    }
  });

  it('rejects a 503 without a valid health body', async () => {
    const resultPromise = firstValueFrom(service.getHealth());

    httpMock.expectOne('/api/health').flush(
      { error: { code: 'DATABASE_UNAVAILABLE', message: 'Sin BD.' } },
      { status: 503, statusText: 'Service Unavailable' },
    );

    const result = await resultPromise;

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.failure.kind).toBe('http');
      expect(result.failure.status).toBe(503);
    }
  });

  it('rejects a 200 response that does not satisfy the health contract', async () => {
    const resultPromise = firstValueFrom(service.getHealth());

    httpMock.expectOne('/api/health').flush({
      status: 'ok',
      api: 'up',
      database: 'up',
    });

    const result = await resultPromise;

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.failure.kind).toBe('invalid-response');
    }
  });

  it('maps transport failures to network errors', async () => {
    const resultPromise = firstValueFrom(service.getHealth());
    const request = httpMock.expectOne('/api/health');
    request.error(new ProgressEvent('error'));

    const result = await resultPromise;

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.failure.kind).toBe('network');
    }
  });
});
