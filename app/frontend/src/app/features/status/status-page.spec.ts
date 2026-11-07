import { TestBed } from '@angular/core/testing';
import { of, Subject } from 'rxjs';

import type { ApiHealth } from '../../core/models/api-health.model';
import type { ApiInfo } from '../../core/models/api-info.model';
import type { ApiResult } from '../../core/models/api-result.model';
import { StatusPage } from './status-page';
import { StatusService, type StatusSnapshot } from './status.service';

const checkedAt = '2026-11-07T18:30:00.000Z';

const info: ApiInfo = {
  environment: 'dev',
  apiVersion: 'v1',
  appVersion: '0.1.0',
  instanceId: 'api-1',
};

const healthy: ApiHealth = {
  status: 'ok',
  api: 'up',
  database: 'up',
  checkedAt,
};

const degraded: ApiHealth = {
  status: 'degraded',
  api: 'up',
  database: 'down',
  checkedAt,
};

function snapshot(
  infoResult: ApiResult<ApiInfo>,
  healthResult: ApiResult<ApiHealth>,
): StatusSnapshot {
  return { info: infoResult, health: healthResult };
}

function configure(load: StatusService['load']): void {
  TestBed.configureTestingModule({
    imports: [StatusPage],
    providers: [{ provide: StatusService, useValue: { load } }],
  });
}

function render(): HTMLElement {
  const fixture = TestBed.createComponent(StatusPage);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('StatusPage', () => {
  it('shows API and PostgreSQL available from a valid health response', () => {
    configure(() => of(snapshot({ ok: true, value: info }, { ok: true, value: healthy })));

    const text = render().textContent ?? '';

    expect(text).toContain('Disponible');
    expect(text).toContain('dev');
    expect(text).toContain('0.1.0');
    expect(text).toContain('api-1');
  });

  it('treats a valid 503 health result as a current database-down check', () => {
    configure(() => of(snapshot({ ok: true, value: info }, { ok: true, value: degraded })));

    const text = render().textContent ?? '';

    expect(text).toContain('API');
    expect(text).toContain('No disponible');
    expect(text).not.toContain('Se muestran como históricos');
    expect(text).toContain('Sin comprobaciones correctas');
  });

  it('shows API partially available when info works but health fails by network', () => {
    configure(() =>
      of(
        snapshot(
          { ok: true, value: info },
          {
            ok: false,
            failure: { kind: 'network', message: 'Sin conexión.' },
          },
        ),
      ),
    );

    const text = render().textContent ?? '';

    expect(text).toContain('Disponible parcialmente');
    expect(text).toContain('Desconocida');
    expect(text).toContain('Sin conexión.');
  });

  it('shows both services down only when both requests fail by network', () => {
    configure(() =>
      of(
        snapshot(
          { ok: false, failure: { kind: 'network', message: 'Sin conexión.' } },
          { ok: false, failure: { kind: 'network', message: 'Sin conexión.' } },
        ),
      ),
    );

    const text = render().textContent ?? '';

    expect(text).toContain('No disponible');
    expect(text).toContain('Desconocida');
    expect(text).not.toContain('Se muestran como históricos');
  });

  it('does not show success for an invalid health response', () => {
    configure(() =>
      of(
        snapshot(
          { ok: true, value: info },
          {
            ok: false,
            failure: {
              kind: 'invalid-response',
              message: 'La respuesta de /api/health no cumple el contrato.',
            },
          },
        ),
      ),
    );

    const text = render().textContent ?? '';

    expect(text).toContain('Disponible parcialmente');
    expect(text).toContain('Desconocida');
    expect(text).toContain('no cumple el contrato');
  });

  it('marks preserved data as stale after a failed refresh', () => {
    const load = vi
      .fn<StatusService['load']>()
      .mockReturnValueOnce(of(snapshot({ ok: true, value: info }, { ok: true, value: healthy })))
      .mockReturnValueOnce(
        of(
          snapshot(
            { ok: false, failure: { kind: 'network', message: 'Sin conexión.' } },
            { ok: false, failure: { kind: 'network', message: 'Sin conexión.' } },
          ),
        ),
      );

    configure(load);

    const fixture = TestBed.createComponent(StatusPage);
    fixture.detectChanges();
    fixture.nativeElement.querySelector('button')?.click();
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Se muestran como históricos');
    expect(text).toContain('Sin conexión.');
  });

  it('prevents duplicate refreshes while a request is in flight', () => {
    const load = vi.fn<StatusService['load']>(() => new Subject<StatusSnapshot>());
    configure(load);

    const fixture = TestBed.createComponent(StatusPage);
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    expect(load).toHaveBeenCalledTimes(1);
  });
});
