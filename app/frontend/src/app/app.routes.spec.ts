import { TestBed } from '@angular/core/testing';
import { importProvidersFrom } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of } from 'rxjs';

import { RecordsService } from './features/records/records.service';
import { StatusService } from './features/status/status.service';

import { routes } from './app.routes';
import { RecordsPage } from './features/records/records-page';
import { StatusPage } from './features/status/status-page';
import { NotFoundPage } from './shared/not-found/not-found-page';

describe('routes', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        importProvidersFrom(MatDialogModule),
        {
          provide: StatusService,
          useValue: {
            load: () =>
              of({
                info: {
                  ok: false,
                  failure: { kind: 'network', message: 'Sin conexión.' },
                },
                health: {
                  ok: false,
                  failure: { kind: 'network', message: 'Sin conexión.' },
                },
              }),
          },
        },
        {
          provide: RecordsService,
          useValue: {
            list: () => of({ ok: true, value: { items: [], total: 0 } }),
            create: () => of({ ok: false, failure: { kind: 'network', message: 'x' } }),
            remove: () => of({ ok: true, value: undefined }),
          },
        },
      ],
    });
  });

  it('redirects the root path to /estado', async () => {
    const harness = await RouterTestingHarness.create();

    await harness.navigateByUrl('/');

    expect(TestBed.inject(Router).url).toBe('/estado');
  });

  it('loads the status and records pages', async () => {
    const harness = await RouterTestingHarness.create();

    expect(await harness.navigateByUrl('/estado', StatusPage)).toBeInstanceOf(StatusPage);
    expect(await harness.navigateByUrl('/registros', RecordsPage)).toBeInstanceOf(RecordsPage);
  });

  it('shows the not-found page for unknown routes', async () => {
    const harness = await RouterTestingHarness.create();

    expect(await harness.navigateByUrl('/ruta-inexistente', NotFoundPage)).toBeInstanceOf(
      NotFoundPage,
    );
  });
});
