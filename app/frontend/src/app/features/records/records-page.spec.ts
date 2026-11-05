import { TestBed } from '@angular/core/testing';

import { RecordsPage } from './records-page';

describe('RecordsPage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecordsPage],
    }).compileComponents();
  });

  it('renders an integration-pending message without fake records', () => {
    const fixture = TestBed.createComponent(RecordsPage);
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Registros');
    expect(text).toContain('Funcionalidad pendiente de implementación');
    expect(text).not.toContain('No hay registros');
  });
});
