import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { ConfirmDeleteDialog } from './confirm-delete-dialog';

describe('ConfirmDeleteDialog', () => {
  function configure(): { close: ReturnType<typeof vi.fn> } {
    const close = vi.fn();

    TestBed.configureTestingModule({
      imports: [ConfirmDeleteDialog],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: { title: 'Prueba' } },
        { provide: MatDialogRef, useValue: { close } },
      ],
    });

    return { close };
  }

  it('shows the record title and cancels with false', () => {
    const { close } = configure();
    const fixture = TestBed.createComponent(ConfirmDeleteDialog);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('Prueba');

    const buttons = element.querySelectorAll<HTMLButtonElement>('button');
    expect(buttons[0]?.textContent?.trim()).toBe('Cancelar');
    expect(buttons[0]?.classList.contains('dialog-cancel')).toBe(true);

    buttons[0]?.click();

    expect(close).toHaveBeenCalledWith(false);
  });

  it('confirms deletion with true', () => {
    const { close } = configure();
    const fixture = TestBed.createComponent(ConfirmDeleteDialog);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const buttons = element.querySelectorAll<HTMLButtonElement>('button');
    buttons[1]?.click();

    expect(close).toHaveBeenCalledWith(true);
  });
});
