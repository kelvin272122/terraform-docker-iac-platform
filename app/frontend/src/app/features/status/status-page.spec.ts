import { TestBed } from '@angular/core/testing';

import { StatusPage } from './status-page';

describe('StatusPage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatusPage],
    }).compileComponents();
  });

  it('renders the status card structure with neutral values', () => {
    const fixture = TestBed.createComponent(StatusPage);
    fixture.detectChanges();

    const element: HTMLElement = fixture.nativeElement;
    const text = element.textContent ?? '';

    expect(text).toContain('Estado');
    expect(text).toContain('Entorno');
    expect(text).toContain('Versión de la interfaz');
    expect(text).toContain('API');
    expect(text).toContain('PostgreSQL');
    expect(text).toContain('Pendiente de integración');
    expect(text).toContain('Sin comprobaciones realizadas');
  });

  it('keeps the refresh action disabled with an explanation', () => {
    const fixture = TestBed.createComponent(StatusPage);
    fixture.detectChanges();

    const element: HTMLElement = fixture.nativeElement;
    const button = element.querySelector<HTMLButtonElement>('button');

    expect(button?.disabled).toBe(true);
    expect(element.querySelector('#refresh-help')?.textContent).toContain(
      'integrar la API',
    );
  });
});
