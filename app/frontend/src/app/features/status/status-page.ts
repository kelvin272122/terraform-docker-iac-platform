import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { Subject, finalize, startWith, switchMap } from 'rxjs';

import { FRONTEND_VERSION } from '../../core/frontend-version.generated';
import type { ApiHealth } from '../../core/models/api-health.model';
import type { ApiInfo } from '../../core/models/api-info.model';
import { LocalDateTimePipe } from '../../core/pipes/local-date-time.pipe';
import { StatusService, type StatusSnapshot } from './status.service';

export type ApiAvailability = 'checking' | 'up' | 'partial' | 'down' | 'unexpected';
export type DatabaseState = 'unknown' | 'up' | 'down' | 'checking';

@Component({
  selector: 'app-status-page',
  imports: [MatButtonModule, MatCardModule, LocalDateTimePipe],
  templateUrl: './status-page.html',
  styleUrl: './status-page.scss',
})
export class StatusPage {
  private readonly statusService = inject(StatusService);
  private readonly refreshTrigger = new Subject<void>();

  protected readonly frontendVersion = FRONTEND_VERSION;
  protected readonly loading = signal(false);
  protected readonly apiState = signal<ApiAvailability>('checking');
  protected readonly databaseState = signal<DatabaseState>('checking');
  protected readonly info = signal<ApiInfo | null>(null);
  protected readonly infoStale = signal(false);
  protected readonly infoError = signal<string | null>(null);
  protected readonly healthError = signal<string | null>(null);
  protected readonly lastHealthCheckAt = signal<string | null>(null);
  protected readonly lastHealthyAt = signal<string | null>(null);
  protected readonly healthStale = signal(false);

  constructor() {
    this.refreshTrigger
      .pipe(
        startWith(undefined),
        switchMap(() => {
          this.loading.set(true);
          return this.statusService
            .load()
            .pipe(finalize(() => this.loading.set(false)));
        }),
        takeUntilDestroyed(),
      )
      .subscribe((snapshot) => this.applySnapshot(snapshot));
  }

  protected refresh(): void {
    if (this.loading()) {
      return;
    }

    this.refreshTrigger.next();
  }

  protected apiLabel(): string {
    switch (this.apiState()) {
      case 'up':
        return 'Disponible';
      case 'partial':
        return 'Disponible parcialmente';
      case 'down':
        return 'No disponible';
      case 'unexpected':
        return 'Respuesta no válida';
      case 'checking':
        return 'Comprobando…';
    }
  }

  protected databaseLabel(): string {
    switch (this.databaseState()) {
      case 'up':
        return 'Disponible';
      case 'down':
        return 'No disponible';
      case 'unknown':
        return 'Desconocida';
      case 'checking':
        return 'Comprobando…';
    }
  }

  protected apiClass(): string {
    return this.stateClass(this.apiState());
  }

  protected databaseClass(): string {
    return this.stateClass(this.databaseState());
  }

  protected hasStaleData(): boolean {
    return this.infoStale() || this.healthStale();
  }

  protected liveSummary(): string {
    return `API: ${this.apiLabel()}. PostgreSQL: ${this.databaseLabel()}.`;
  }

  private applySnapshot(snapshot: StatusSnapshot): void {
    const infoResult = snapshot.info;
    const healthResult = snapshot.health;

    if (infoResult.ok) {
      this.info.set(infoResult.value);
      this.infoStale.set(false);
      this.infoError.set(null);
    } else {
      this.infoError.set(infoResult.failure.message);
      if (this.info() !== null) {
        this.infoStale.set(true);
      }
    }

    if (healthResult.ok) {
      this.applyHealth(healthResult.value);
    } else {
      this.databaseState.set('unknown');
      this.healthError.set(healthResult.failure.message);
      this.healthStale.set(this.lastHealthCheckAt() !== null);
      this.apiState.set(
        infoResult.ok
          ? 'partial'
          : healthResult.failure.kind === 'network' ||
              healthResult.failure.kind === 'timeout'
            ? 'down'
            : 'unexpected',
      );
    }
  }

  private applyHealth(health: ApiHealth): void {
    this.lastHealthCheckAt.set(health.checkedAt);
    this.healthError.set(null);
    this.healthStale.set(false);
    this.apiState.set('up');

    if (health.database === 'up') {
      this.databaseState.set('up');
      this.lastHealthyAt.set(health.checkedAt);
    } else {
      this.databaseState.set('down');
    }
  }

  private stateClass(state: ApiAvailability | DatabaseState): string {
    switch (state) {
      case 'up':
        return 'status-value--ok';
      case 'down':
        return 'status-value--error';
      case 'partial':
      case 'unexpected':
      case 'unknown':
        return 'status-value--warning';
      case 'checking':
        return 'status-value--pending';
    }
  }
}
