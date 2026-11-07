import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';

export interface ConfirmDeleteDialogData {
  readonly title: string;
}

@Component({
  selector: 'app-confirm-delete-dialog',
  imports: [MatButtonModule, MatDialogModule],
  templateUrl: './confirm-delete-dialog.html',
  styleUrl: './confirm-delete-dialog.scss',
})
export class ConfirmDeleteDialog {
  protected readonly data = inject<ConfirmDeleteDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<ConfirmDeleteDialog, boolean>);

  protected cancel(): void {
    this.dialogRef.close(false);
  }

  protected confirm(): void {
    this.dialogRef.close(true);
  }
}
