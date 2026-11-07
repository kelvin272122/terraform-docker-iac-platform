import { timeout } from 'rxjs';

export const API_TIMEOUT_MS = 8_000;

export function withApiTimeout<T>() {
  return timeout<T>(API_TIMEOUT_MS);
}
