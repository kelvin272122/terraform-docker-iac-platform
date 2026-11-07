import { LocalDateTimePipe } from './local-date-time.pipe';

describe('LocalDateTimePipe', () => {
  const pipe = new LocalDateTimePipe();

  it('formats a valid ISO date with date, time and time zone', () => {
    const result = pipe.transform('2026-11-07T18:30:00.000Z');

    expect(result).not.toBe('—');
    expect(result).not.toBe('Fecha no válida');
    expect(result).toMatch(/\d/);
  });

  it('returns a placeholder for empty values', () => {
    expect(pipe.transform(null)).toBe('—');
    expect(pipe.transform(undefined)).toBe('—');
    expect(pipe.transform('')).toBe('—');
  });

  it('returns a safe message for invalid dates', () => {
    expect(pipe.transform('no-es-una-fecha')).toBe('Fecha no válida');
  });
});
