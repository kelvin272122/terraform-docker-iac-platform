import { HttpErrorResponse } from '@angular/common/http';
import { TimeoutError } from 'rxjs';

import type { ApiFailure } from '../models/api-error.model';
import { parseApiErrorBody } from './runtime-guards';

export function toApiFailure(error: unknown): ApiFailure {
  if (error instanceof TimeoutError) {
    return {
      kind: 'timeout',
      message: 'La solicitud superó el tiempo máximo de 8 segundos.',
    };
  }

  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) {
      return {
        kind: 'network',
        message: 'No se pudo conectar con el servicio.',
      };
    }

    const parsed = parseApiErrorBody(error.error);

    return {
      kind: 'http',
      status: error.status,
      message: parsed?.message ?? defaultHttpMessage(error.status),
      ...(parsed?.code ? { code: parsed.code } : {}),
      ...(parsed?.fields ? { fields: parsed.fields } : {}),
    };
  }

  return {
    kind: 'network',
    message: 'No se pudo completar la solicitud.',
  };
}

export function isConfirmedMutationFailure(failure: ApiFailure): boolean {
  return failure.kind === 'http' && (failure.status === 400 || failure.status === 404);
}

function defaultHttpMessage(status: number): string {
  switch (status) {
    case 400:
      return 'La solicitud no es válida.';
    case 404:
      return 'El recurso no existe.';
    case 413:
      return 'La solicitud es demasiado grande.';
    case 500:
      return 'Ocurrió un error interno.';
    case 503:
      return 'El servicio no está disponible.';
    default:
      return 'No se pudo completar la solicitud.';
  }
}
