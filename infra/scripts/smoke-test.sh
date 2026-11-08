#!/usr/bin/env bash
# Prueba rápida de un entorno desplegado: info, salud y ciclo
# crear -> listar -> eliminar con un registro temporal identificable.
# Uso: infra/scripts/smoke-test.sh ENTORNO   (ENTORNO: dev | prod)
# Sale con código distinto de cero si alguna comprobación falla.

source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

ENVIRONMENT="${1:-}"
require_env "$ENVIRONMENT"
require_tools curl

PORT="$(host_port_for "$ENVIRONMENT")"
[[ -n "$PORT" ]] || die "No se encontró host_port en environments/$ENVIRONMENT.tfvars."
URL="http://127.0.0.1:$PORT"
BODY_FILE="$(mktemp)"
# curl de Git Bash es un ejecutable nativo de Windows: necesita la ruta C:/...
command -v cygpath >/dev/null 2>&1 && BODY_FILE="$(cygpath -m "$BODY_FILE")"
RECORD_ID=""
FAILURES=0

cleanup() {
  # Si la prueba se interrumpe después de crear el registro, se elimina.
  if [[ -n "$RECORD_ID" ]]; then
    curl -s -o /dev/null -X DELETE "$URL/api/records/$RECORD_ID" || true
  fi
  rm -f "$BODY_FILE"
}
trap cleanup EXIT

# request MÉTODO RUTA [JSON] -> imprime el código HTTP y deja el cuerpo en BODY_FILE
request() {
  local method="$1" path="$2" data="${3:-}"
  local args=(-s -o "$BODY_FILE" -w '%{http_code}' --max-time 10 -X "$method")
  [[ -n "$data" ]] && args+=(-H 'Content-Type: application/json' --data "$data")
  curl "${args[@]}" "$URL$path" || echo "000"
}

check() {
  local name="$1" condition="$2"
  if eval "$condition"; then
    ok "$name"
  else
    warn "FALLÓ: $name -> $(head -c 300 "$BODY_FILE")"
    FAILURES=$((FAILURES + 1))
  fi
}

info "Smoke test de $ENVIRONMENT en $URL"

code="$(request GET /)"
check "GET / responde 200 con la interfaz" '[[ $code == 200 ]] && grep -q "<app-root" "$BODY_FILE"'

code="$(request GET /api/info)"
check "GET /api/info responde 200 con environment=$ENVIRONMENT" \
  '[[ $code == 200 ]] && grep -q "\"environment\":\"$ENVIRONMENT\"" "$BODY_FILE"'

code="$(request GET /api/health)"
check "GET /api/health responde 200 con database=up" \
  '[[ $code == 200 ]] && grep -q "\"database\":\"up\"" "$BODY_FILE"'

TITLE="smoke-test-$(date +%Y%m%d%H%M%S)-$RANDOM"
code="$(request POST /api/records "{\"title\":\"$TITLE\",\"description\":\"Registro temporal del smoke test\"}")"
RECORD_ID="$(sed -n 's/.*"id":"\([0-9a-f-]\{36\}\)".*/\1/p' "$BODY_FILE")"
check "POST /api/records crea el registro (201)" '[[ $code == 201 && -n $RECORD_ID ]]'

code="$(request GET /api/records)"
check "GET /api/records lista el registro creado" '[[ $code == 200 ]] && grep -q "$TITLE" "$BODY_FILE"'

if [[ -n "$RECORD_ID" ]]; then
  code="$(request DELETE "/api/records/$RECORD_ID")"
  check "DELETE /api/records/:id responde 204" '[[ $code == 204 ]]'
  [[ "$code" == 204 ]] && RECORD_ID=""
fi

code="$(request GET /api/records)"
check "El registro ya no aparece en el listado" '[[ $code == 200 ]] && ! grep -q "$TITLE" "$BODY_FILE"'

if (( FAILURES > 0 )); then
  die "Smoke test de $ENVIRONMENT: $FAILURES comprobación(es) fallida(s)."
fi
info "Smoke test de $ENVIRONMENT aprobado"
