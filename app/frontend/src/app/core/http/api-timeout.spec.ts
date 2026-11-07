import { firstValueFrom, NEVER, TimeoutError } from 'rxjs';
import { vi } from 'vitest';

import { API_TIMEOUT_MS, withApiTimeout } from './api-timeout';

describe('withApiTimeout', () => {
  it('emits a TimeoutError after eight seconds', async () => {
    vi.useFakeTimers();

    try {
      const result = firstValueFrom(NEVER.pipe(withApiTimeout()));
      const assertion = expect(result).rejects.toBeInstanceOf(TimeoutError);

      await vi.advanceTimersByTimeAsync(API_TIMEOUT_MS);
      await assertion;
    } finally {
      vi.useRealTimers();
    }
  });

  it('uses an eight second budget', () => {
    expect(API_TIMEOUT_MS).toBe(8_000);
  });
});
