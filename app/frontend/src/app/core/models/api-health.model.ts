export type DatabaseAvailability = 'up' | 'down';

export interface ApiHealth {
  readonly status: 'ok' | 'degraded';
  readonly api: 'up';
  readonly database: DatabaseAvailability;
  readonly checkedAt: string;
}
