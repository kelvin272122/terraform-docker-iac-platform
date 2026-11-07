import { HttpErrorResponse } from '@angular/common/http';
import { TimeoutError } from 'rxjs';

import { isConfirmedMutationFailure, toApiFailure } from './api-error-mapper';

describe('toApiFailure', () => {
  it('maps the approved error envelope', () => {
    const failure = toApiFailure(
      new HttpErrorResponse({
        status: 400,
        error: {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Revisa los datos enviados.',
            fields: { title: 'El título es obligatorio.' },
          },
        },
      }),
    );

    expect(failure).toEqual({
      kind: 'http',
      status: 400,
      code: 'VALIDATION_ERROR',
      message: 'Revisa los datos enviados.',
      fields: { title: 'El título es obligatorio.' },
    });
  });

  it('maps HTTP transport failures to network errors', () => {
    expect(toApiFailure(new HttpErrorResponse({ status: 0 })).kind).toBe('network');
  });

  it('maps timeouts', () => {
    expect(toApiFailure(new TimeoutError()).kind).toBe('timeout');
  });

  it('uses a safe message when the body is not the approved envelope', () => {
    const failure = toApiFailure(
      new HttpErrorResponse({ status: 503, error: '<html>proxy error</html>' }),
    );

    expect(failure).toEqual({
      kind: 'http',
      status: 503,
      message: 'El servicio no está disponible.',
    });
  });
});

describe('isConfirmedMutationFailure', () => {
  it('only considers 400 and 404 as confirmed failures', () => {
    expect(
      isConfirmedMutationFailure({ kind: 'http', status: 400, message: 'x' }),
    ).toBe(true);
    expect(
      isConfirmedMutationFailure({ kind: 'http', status: 404, message: 'x' }),
    ).toBe(true);
    expect(
      isConfirmedMutationFailure({ kind: 'http', status: 503, message: 'x' }),
    ).toBe(false);
    expect(isConfirmedMutationFailure({ kind: 'timeout', message: 'x' })).toBe(
      false,
    );
  });
});
