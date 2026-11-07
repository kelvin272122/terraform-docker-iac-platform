import { FormControl } from '@angular/forms';

import {
  DESCRIPTION_MAX_CODE_POINTS,
  TITLE_MAX_CODE_POINTS,
  maxCodePointsValidator,
  trimmedRequiredValidator,
} from './record-form.validators';

function titleControl(value: string): FormControl<string> {
  return new FormControl(value, {
    nonNullable: true,
    validators: [
      trimmedRequiredValidator,
      maxCodePointsValidator(TITLE_MAX_CODE_POINTS),
    ],
  });
}

function descriptionControl(value: string): FormControl<string> {
  return new FormControl(value, {
    nonNullable: true,
    validators: [maxCodePointsValidator(DESCRIPTION_MAX_CODE_POINTS)],
  });
}

describe('record form validators', () => {
  it('rejects blank titles and accepts trimmed titles', () => {
    expect(titleControl('   ').hasError('required')).toBe(true);
    expect(titleControl('  Prueba  ').valid).toBe(true);
  });

  it('counts UTF-16 surrogate pairs as one character', () => {
    expect(titleControl('\u{1F600}'.repeat(100)).valid).toBe(true);
    expect(titleControl('\u{1F600}'.repeat(101)).hasError('maxCodePoints')).toBe(
      true,
    );
    expect(titleControl('a'.repeat(99) + '\u{1F600}').valid).toBe(true);
  });

  it('applies the description limit in code points', () => {
    expect(descriptionControl('b'.repeat(500)).valid).toBe(true);
    expect(descriptionControl('b'.repeat(501)).hasError('maxCodePoints')).toBe(
      true,
    );
    expect(descriptionControl('\u{1F600}'.repeat(500)).valid).toBe(true);
    expect(
      descriptionControl('\u{1F600}'.repeat(501)).hasError('maxCodePoints'),
    ).toBe(true);
  });
});
