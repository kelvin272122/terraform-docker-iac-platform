import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { NotFoundPage } from './not-found-page';

describe('NotFoundPage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotFoundPage],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('renders a not-found message and a link back to status', () => {
    const fixture = TestBed.createComponent(NotFoundPage);
    fixture.detectChanges();

    const element: HTMLElement = fixture.nativeElement;
    const text = element.textContent ?? '';

    expect(text).toContain('Página no encontrada');
    expect(element.querySelector('a[href="/estado"]')?.textContent).toContain(
      'Volver a Estado',
    );
  });
});
