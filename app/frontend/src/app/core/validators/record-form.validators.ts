import type { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

import { codePointLength } from '../utils/code-points';

export const TITLE_MAX_CODE_POINTS = 100;
export const DESCRIPTION_MAX_CODE_POINTS = 500;

export function trimmedRequiredValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;

  if (typeof value !== 'string' || value.trim().length === 0) {
    return { required: true };
  }

  return null;
}

export function maxCodePointsValidator(max: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    if (typeof value !== 'string') {
      return null;
    }

    const length = codePointLength(value.trim());

    return length > max
      ? { maxCodePoints: { max, actual: length } }
      : null;
  };
}
