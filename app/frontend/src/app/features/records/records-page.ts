import { Component, DestroyRef, ElementRef, ViewChild, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormBuilder,
  type FormControl,
  type FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Subject, finalize, startWith, switchMap } from 'rxjs';

import type { ApiResult } from '../../core/models/api-result.model';
import type { RecordItem } from '../../core/models/record.model';
import { LocalDateTimePipe } from '../../core/pipes/local-date-time.pipe';
import {
  DESCRIPTION_MAX_CODE_POINTS,
  TITLE_MAX_CODE_POINTS,
  maxCodePointsValidator,
  trimmedRequiredValidator,
} from '../../core/validators/record-form.validators';
import { trimmedCodePointLength } from '../../core/utils/code-points';
import {
  ConfirmDeleteDialog,
  type ConfirmDeleteDialogData,
} from './confirm-delete-dialog/confirm-delete-dialog';
import { RecordsService } from './records.service';

interface RecordForm {
  readonly title: FormControl<string>;
  readonly description: FormControl<string>;
}

@Component({
  selector: 'app-records-page',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    LocalDateTimePipe,
  ],
  templateUrl: './records-page.html',
  styleUrl: './records-page.scss',
})
export class RecordsPage {
  private readonly recordsService = inject(RecordsService);
  private readonly dialog = inject(MatDialog);
  private readonly formBuilder = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly refreshTrigger = new Subject<void>();

  protected readonly titleMax = TITLE_MAX_CODE_POINTS;
  protected readonly descriptionMax = DESCRIPTION_MAX_CODE_POINTS;
  protected readonly localTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  protected readonly form: FormGroup<RecordForm> = this.formBuilder.nonNullable.group({
    title: [
      '',
      [trimmedRequiredValidator, maxCodePointsValidator(TITLE_MAX_CODE_POINTS)],
    ],
    description: ['', [maxCodePointsValidator(DESCRIPTION_MAX_CODE_POINTS)]],
  });

  protected readonly loadingList = signal(false);
  protected readonly records = signal<readonly RecordItem[]>([]);
  protected readonly total = signal(0);
  protected readonly listError = signal<string | null>(null);
  protected readonly listStale = signal(false);
  protected readonly lastLoadedAt = signal<string | null>(null);
  protected readonly attempted = signal(false);
  protected readonly submitting = signal(false);
  protected readonly serverErrors = signal<Readonly<Record<string, string>>>({});
  protected readonly formError = signal<string | null>(null);
  protected readonly formUnknown = signal(false);
  protected readonly successMessage = signal<string | null>(null);
  protected readonly deletingId = signal<string | null>(null);
  protected readonly deleteError = signal<string | null>(null);
  protected readonly deleteUnknown = signal(false);
  protected readonly deleteMessage = signal<string | null>(null);
  private readonly pendingRefresh = signal<'create' | 'delete' | null>(null);

  @ViewChild('recordsTitle', { read: ElementRef })
  private recordsTitle?: ElementRef<HTMLHeadingElement>;

  constructor() {
    this.refreshTrigger
      .pipe(
        startWith(undefined),
        switchMap(() => {
          this.loadingList.set(true);
          return this.recordsService
            .list()
            .pipe(finalize(() => this.loadingList.set(false)));
        }),
        takeUntilDestroyed(),
      )
      .subscribe((result) => this.applyListResult(result));
  }

  protected titleLength(): number {
    return trimmedCodePointLength(this.form.controls.title.value);
  }

  protected descriptionLength(): number {
    return trimmedCodePointLength(this.form.controls.description.value);
  }

  protected titleServerError(): string | null {
    return this.serverErrors()['title'] ?? null;
  }

  protected descriptionServerError(): string | null {
    return this.serverErrors()['description'] ?? null;
  }

  protected titleError(): string | null {
    const control = this.form.controls.title;
    const serverError = this.serverErrors()['title'];

    if (serverError) {
      return serverError;
    }

    if (control.hasError('required') && (this.attempted() || control.touched)) {
      return 'El título es obligatorio.';
    }

    if (control.hasError('maxCodePoints') && (this.attempted() || control.touched)) {
      return `El título no puede superar los ${TITLE_MAX_CODE_POINTS} caracteres.`;
    }

    return null;
  }

  protected descriptionError(): string | null {
    const control = this.form.controls.description;
    const serverError = this.serverErrors()['description'];

    if (serverError) {
      return serverError;
    }

    if (control.hasError('maxCodePoints') && (this.attempted() || control.touched)) {
      return `La descripción no puede superar los ${DESCRIPTION_MAX_CODE_POINTS} caracteres.`;
    }

    return null;
  }

  protected submit(): void {
    if (this.submitting()) {
      return;
    }

    this.attempted.set(true);
    this.form.markAllAsTouched();
    this.serverErrors.set({});
    this.formError.set(null);
    this.formUnknown.set(false);
    this.successMessage.set(null);
    this.deleteError.set(null);
    this.deleteUnknown.set(false);
    this.deleteMessage.set(null);

    if (this.form.invalid) {
      return;
    }

    const title = this.form.controls.title.value.trim();
    const descriptionValue = this.form.controls.description.value.trim();
    const description = descriptionValue === '' ? null : descriptionValue;

    this.submitting.set(true);
    this.recordsService
      .create({ title, description })
      .pipe(
        finalize(() => this.submitting.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((result) => this.applyCreateResult(result));
  }

  protected refreshList(): void {
    this.refreshTrigger.next();
  }

  protected confirmDelete(record: RecordItem): void {
    if (this.deletingId()) {
      return;
    }

    this.dialog
      .open<ConfirmDeleteDialog, ConfirmDeleteDialogData, boolean>(
        ConfirmDeleteDialog,
        {
          data: { title: record.title },
          autoFocus: '.dialog-cancel',
          restoreFocus: true,
        },
      )
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed) => {
        if (confirmed === true) {
          this.deleteRecord(record);
        }
      });
  }

  protected isDeleting(record: RecordItem): boolean {
    return this.deletingId() === record.id;
  }

  private applyListResult(result: ApiResult<{ readonly items: readonly RecordItem[]; readonly total: number }>): void {
    if (result.ok) {
      this.records.set(result.value.items);
      this.total.set(result.value.total);
      this.listError.set(null);
      this.listStale.set(false);
      this.lastLoadedAt.set(new Date().toISOString());
      this.pendingRefresh.set(null);
      return;
    }

    this.listError.set(
      this.pendingRefresh() !== null
        ? 'Operación completada; no se pudo actualizar el listado.'
        : result.failure.message,
    );
    this.listStale.set(this.records().length > 0 || this.lastLoadedAt() !== null);
  }

  private applyCreateResult(result: ApiResult<RecordItem>): void {
    if (result.ok) {
      this.form.reset({ title: '', description: '' });
      this.attempted.set(false);
      this.serverErrors.set({});
      this.successMessage.set('Registro creado correctamente.');
      this.applyCreated(result.value);
      this.pendingRefresh.set('create');
      this.refreshList();
      return;
    }

    const failure = result.failure;

    if (failure.kind === 'http' && failure.status === 400) {
      this.serverErrors.set(failure.fields ?? {});
      this.formError.set(failure.fields ? null : failure.message);
      return;
    }

    this.formUnknown.set(true);
    this.formError.set(null);
  }

  private applyDeleteResult(record: RecordItem, result: ApiResult<void>): void {
    if (result.ok) {
      this.deleteMessage.set('Registro eliminado correctamente.');
      this.applyDeleted(record.id);
      this.pendingRefresh.set('delete');
      this.refreshList();
      this.focusAfterDelete();
      return;
    }

    const failure = result.failure;

    if (failure.kind === 'http' && failure.status === 404) {
      this.deleteMessage.set('El registro ya no existe.');
      this.applyDeleted(record.id);
      this.pendingRefresh.set('delete');
      this.refreshList();
      this.focusAfterDelete();
      return;
    }

    if (failure.kind === 'http' && failure.status === 400) {
      this.deleteError.set(failure.message);
      return;
    }

    this.deleteUnknown.set(true);
    this.deleteError.set(null);
  }

  private focusAfterDelete(): void {
    this.recordsTitle?.nativeElement.focus();
  }

  private applyCreated(record: RecordItem): void {
    this.records.update((items) => [record, ...items]);
    this.total.update((total) => total + 1);
  }

  private applyDeleted(id: string): void {
    this.records.update((items) => items.filter((item) => item.id !== id));
    this.total.update((total) => Math.max(0, total - 1));
  }

  private deleteRecord(record: RecordItem): void {
    this.deletingId.set(record.id);
    this.deleteError.set(null);
    this.deleteUnknown.set(false);
    this.deleteMessage.set(null);
    this.successMessage.set(null);

    this.recordsService
      .remove(record.id)
      .pipe(
        finalize(() => this.deletingId.set(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((result) => this.applyDeleteResult(record, result));
  }
}
