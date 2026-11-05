import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { routes } from './app.routes';
import { RecordsPage } from './features/records/records-page';
import { StatusPage } from './features/status/status-page';
import { NotFoundPage } from './shared/not-found/not-found-page';

describe('routes', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter(routes)],
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
