import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { Subject, of } from 'rxjs';

import type { ApiFailure } from '../../core/models/api-error.model';
import type { ApiResult } from '../../core/models/api-result.model';
import type { RecordItem, RecordsList } from '../../core/models/record.model';
import { RecordsPage } from './records-page';
import { RecordsService } from './records.service';

const createdAt = '2026-11-07T18:30:00.000Z';
const record: RecordItem = {
  id: '00000000-0000-4000-8000-000000000001',
  title: 'Prueba',
  description: null,
  createdAt,
};

const emptyList: ApiResult<RecordsList> = {
  ok: true,
  value: { items: [], total: 0 },
};

function ok<T>(value: T): ApiResult<T> {
  return { ok: true, value };
}

function fail<T>(failure: ApiFailure): ApiResult<T> {
  return { ok: false, failure };
}

function listWith(items: readonly RecordItem[]): ApiResult<RecordsList> {
  return ok({ items, total: items.length });
}

function createService(overrides: Partial<RecordsService> = {}): RecordsService {
  return {
    list: vi.fn(() => of(emptyList)),
    create: vi.fn(() => of(ok(record))),
    remove: vi.fn(() => of(ok<void>(undefined))),
    ...overrides,
  } as RecordsService;
}

function createDialog(confirmed: boolean): MatDialog {
  return {
    open: vi.fn(() => ({ afterClosed: () => of(confirmed) })),
  } as unknown as MatDialog;
}

function configure(
  service: RecordsService,
  dialog: MatDialog = createDialog(false),
): void {
  TestBed.configureTestingModule({
    imports: [RecordsPage],
    providers: [
      { provide: RecordsService, useValue: service },
      { provide: MatDialog, useValue: dialog },
    ],
  });
}

function createPage(): {
  fixture: ComponentFixture<RecordsPage>;
  element: HTMLElement;
} {
  const fixture = TestBed.createComponent(RecordsPage);
  fixture.detectChanges();
  return { fixture, element: fixture.nativeElement as HTMLElement };
}

function setInput(
  element: HTMLElement,
  selector: string,
  value: string,
): void {
  const input = element.querySelector<HTMLInputElement | HTMLTextAreaElement>(
    selector,
  );
  if (!input) {
    throw new Error(`No se encontró ${selector}`);
  }

  input.value = value;
  input.dispatchEvent(new Event('input'));
}

function submit(element: HTMLElement, fixture: ComponentFixture<RecordsPage>): void {
  element.querySelector('form')?.dispatchEvent(
    new Event('submit', { bubbles: true, cancelable: true }),
  );
  fixture.detectChanges();
}

function clickDelete(element: HTMLElement, fixture: ComponentFixture<RecordsPage>): void {
  element
    .querySelector<HTMLButtonElement>('button[aria-label^="Eliminar"]')
    ?.click();
  fixture.detectChanges();
}

describe('RecordsPage', () => {
  it('renders the empty state', () => {
    configure(createService());
    const { element } = createPage();

    expect(element.textContent).toContain('No hay registros.');
    expect(element.textContent).toContain('Total: 0');
  });

  it('renders records returned by the API', () => {
    configure(
      createService({
        list: vi.fn(() => of(listWith([record]))),
      }),
    );
    const { element } = createPage();

    expect(element.textContent).toContain('Prueba');
    expect(element.textContent).toContain('Sin descripción');
    expect(element.textContent).toContain('Total: 1');
  });

  it('validates a required title before calling the API', () => {
    const service = createService();
    configure(service);
    const { fixture, element } = createPage();

    submit(element, fixture);

    expect(element.textContent).toContain('El título es obligatorio.');
    expect(service.create).not.toHaveBeenCalled();
  });

  it('accepts a title of 100 emoji by code points', () => {
    const service = createService();
    configure(service);
    const { fixture, element } = createPage();

    setInput(
      element,
      'input[formcontrolname="title"]',
      '\u{1F600}'.repeat(100),
    );
    submit(element, fixture);

    expect(service.create).toHaveBeenCalledTimes(1);
  });

  it('rejects a title of 101 emoji by code points', () => {
    const service = createService();
    configure(service);
    const { fixture, element } = createPage();

    setInput(
      element,
      'input[formcontrolname="title"]',
      '\u{1F600}'.repeat(101),
    );
    submit(element, fixture);

    expect(element.textContent).toContain(
      'El título no puede superar los 100 caracteres.',
    );
    expect(service.create).not.toHaveBeenCalled();
  });

  it('prevents duplicate submissions while the request is pending', () => {
    const subject = new Subject<ApiResult<RecordItem>>();
    const create = vi.fn(() => subject.asObservable());
    configure(createService({ create }));
    const { fixture, element } = createPage();

    setInput(element, 'input[formcontrolname="title"]', 'Prueba');
    submit(element, fixture);
    submit(element, fixture);

    expect(create).toHaveBeenCalledTimes(1);

    subject.next(ok(record));
    subject.complete();
  });

  it('keeps form values and shows field errors from the backend', () => {
    configure(
      createService({
        create: vi.fn(() =>
          of(
            fail<RecordItem>({
              kind: 'http',
              status: 400,
              code: 'VALIDATION_ERROR',
              message: 'Revisa los datos enviados.',
              fields: { title: 'El título ya existe.' },
            }),
          ),
        ),
      }),
    );
    const { fixture, element } = createPage();

    setInput(element, 'input[formcontrolname="title"]', 'Prueba');
    submit(element, fixture);

    const input = element.querySelector<HTMLInputElement>(
      'input[formcontrolname="title"]',
    );
    expect(input?.value).toBe('Prueba');
    expect(element.textContent).toContain('El título ya existe.');
  });

  it('shows an unknown-outcome warning without retrying the POST', () => {
    const create = vi.fn(() =>
      of(
        fail<RecordItem>({
          kind: 'http',
          status: 503,
          message: 'Sin BD.',
        }),
      ),
    );
    configure(createService({ create }));
    const { fixture, element } = createPage();

    setInput(element, 'input[formcontrolname="title"]', 'Prueba');
    submit(element, fixture);

    expect(create).toHaveBeenCalledTimes(1);
    expect(element.textContent).toContain(
      'No se pudo confirmar si el registro se guardó.',
    );
  });

  it('reports a confirmed create even when the list refresh fails', () => {
    const list = vi
      .fn<RecordsService['list']>()
      .mockReturnValueOnce(of(emptyList))
      .mockReturnValue(
        of(
          fail<RecordsList>({
            kind: 'network',
            message: 'Sin conexión.',
          }),
        ),
      );
    configure(
      createService({
        list,
        create: vi.fn(() => of(ok(record))),
      }),
    );
    const { fixture, element } = createPage();

    setInput(element, 'input[formcontrolname="title"]', 'Prueba');
    submit(element, fixture);

    expect(element.textContent).toContain('Registro creado correctamente.');
    expect(element.textContent).toContain(
      'Operación completada; no se pudo actualizar el listado.',
    );
    expect(element.textContent).toContain('puede estar desactualizado');
  });

  it('does not call DELETE when deletion is cancelled', () => {
    const service = createService({
      list: vi.fn(() => of(listWith([record]))),
    });
    configure(service, createDialog(false));
    const { fixture, element } = createPage();

    clickDelete(element, fixture);

    expect(service.remove).not.toHaveBeenCalled();
  });

  it('deletes a record after confirmation and updates the list', () => {
    const remove = vi.fn(() => of(ok<void>(undefined)));
    const list = vi
      .fn<RecordsService['list']>()
      .mockReturnValueOnce(of(listWith([record])))
      .mockReturnValueOnce(of(emptyList));
    configure(createService({ list, remove }), createDialog(true));
    const { fixture, element } = createPage();

    clickDelete(element, fixture);

    expect(remove).toHaveBeenCalledWith(record.id);
    expect(element.textContent).toContain('Registro eliminado correctamente.');
    expect(element.textContent).toContain('Total: 0');
  });

  it('treats DELETE 404 as an already missing record', () => {
    const remove = vi.fn(() =>
      of(
        fail<void>({
          kind: 'http',
          status: 404,
          code: 'RECORD_NOT_FOUND',
          message: 'El registro no existe.',
        }),
      ),
    );
    configure(
      createService({
        list: vi.fn(() => of(listWith([record]))),
        remove,
      }),
      createDialog(true),
    );
    const { fixture, element } = createPage();

    clickDelete(element, fixture);

    expect(element.textContent).toContain('El registro ya no existe.');
  });

  it('keeps the record and warns when DELETE outcome is unknown', () => {
    const remove = vi.fn(() =>
      of(
        fail<void>({
          kind: 'timeout',
          message: 'Timeout.',
        }),
      ),
    );
    configure(
      createService({
        list: vi.fn(() => of(listWith([record]))),
        remove,
      }),
      createDialog(true),
    );
    const { fixture, element } = createPage();

    clickDelete(element, fixture);

    expect(remove).toHaveBeenCalledTimes(1);
    expect(element.textContent).toContain('Prueba');
    expect(element.textContent).toContain(
      'No se pudo confirmar si el registro se eliminó.',
    );
  });

  it('does not show fake data when the initial list fails', () => {
    configure(
      createService({
        list: vi.fn(() =>
          of(
            fail<RecordsList>({
              kind: 'network',
              message: 'Sin conexión.',
            }),
          ),
        ),
      }),
    );
    const { element } = createPage();

    expect(element.textContent).toContain('Sin conexión.');
    expect(element.textContent).not.toContain('No hay registros.');
  });
});
