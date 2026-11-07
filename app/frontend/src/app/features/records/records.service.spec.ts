import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { RecordsService } from './records.service';

const createdAt = '2026-11-07T18:30:00.000Z';
const record = {
  id: '00000000-0000-4000-8000-000000000001',
  title: 'Prueba',
  description: null,
  createdAt,
};

describe('RecordsService', () => {
  let service: RecordsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(RecordsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('lists records from /api/records', async () => {
    const resultPromise = firstValueFrom(service.list());
    const request = httpMock.expectOne('/api/records');

    expect(request.request.method).toBe('GET');
    request.flush({ items: [record], total: 1 });

    const result = await resultPromise;

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.total).toBe(1);
    }
  });

  it('rejects a list whose total does not match the items', async () => {
    const resultPromise = firstValueFrom(service.list());
    httpMock.expectOne('/api/records').flush({ items: [record], total: 2 });

    const result = await resultPromise;

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.failure.kind).toBe('invalid-response');
    }
  });

  it('creates a record with POST /api/records', async () => {
    const resultPromise = firstValueFrom(
      service.create({ title: 'Prueba', description: null }),
    );
    const request = httpMock.expectOne('/api/records');

    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ title: 'Prueba', description: null });
    request.flush(record, { status: 201, statusText: 'Created' });

    const result = await resultPromise;

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual(record);
    }
  });

  it('rejects an invalid creation response', async () => {
    const resultPromise = firstValueFrom(
      service.create({ title: 'Prueba', description: null }),
    );
    httpMock.expectOne('/api/records').flush(
      { unexpected: true },
      { status: 201, statusText: 'Created' },
    );

    const result = await resultPromise;

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.failure.kind).toBe('invalid-response');
    }
  });

  it('deletes a record with DELETE /api/records/:id', async () => {
    const resultPromise = firstValueFrom(service.remove(record.id));
    const request = httpMock.expectOne(`/api/records/${record.id}`);

    expect(request.request.method).toBe('DELETE');
    request.flush(null, { status: 204, statusText: 'No Content' });

    const result = await resultPromise;

    expect(result.ok).toBe(true);
  });

  it('maps a 404 response to a confirmed HTTP failure', async () => {
    const resultPromise = firstValueFrom(service.remove(record.id));
    httpMock.expectOne(`/api/records/${record.id}`).flush(
      { error: { code: 'RECORD_NOT_FOUND', message: 'El registro no existe.' } },
      { status: 404, statusText: 'Not Found' },
    );

    const result = await resultPromise;

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.failure).toEqual({
        kind: 'http',
        status: 404,
        code: 'RECORD_NOT_FOUND',
        message: 'El registro no existe.',
      });
    }
  });
});
