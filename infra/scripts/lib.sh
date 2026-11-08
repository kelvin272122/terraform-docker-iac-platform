#!/usr/bin/env bash
# Funciones comunes de los scripts de infraestructura. Se carga con `source`.

set -euo pipefail

# Ruta absoluta que entienden también los ejecutables nativos: en Git Bash
# (Windows) `pwd -W` devuelve C:/...; en Linux y macOS se usa `pwd`.
abs_dir() { (cd "$1" && { pwd -W 2>/dev/null || pwd; }); }

SCRIPTS_DIR="$(abs_dir "$(dirname "${BASH_SOURCE[0]}")")"
INFRA_DIR="$(abs_dir "$SCRIPTS_DIR/..")"
REPO_ROOT="$(abs_dir "$INFRA_DIR/..")"

POSTGRES_IMAGE="postgres:17.11-bookworm@sha256:665dc7b37ac52a17e298511414c21d23ffa4e6a6ef6225b3e5d59c7afb35e994"
STAGE_TIMEOUT=120

# En Git Bash (Windows) evita que las rutas de los argumentos de docker
# se conviertan a rutas de Windows.
export MSYS_NO_PATHCONV=1

info() { printf '\033[1;34m==>\033[0m %s\n' "$*"; }
ok()   { printf '\033[1;32m OK\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m !!\033[0m %s\n' "$*" >&2; }
die()  { printf '\033[1;31mERROR\033[0m %s\n' "$*" >&2; exit 1; }

require_env() {
  local env="${1:-}"
  [[ "$env" == "dev" || "$env" == "prod" ]] || die "Entorno inválido: \"$env\". Usa dev o prod."
}

require_version() {
  local version="${1:-}"
  [[ "$version" =~ ^[0-9]+\.[0-9]+\.[0-9]+([-.][0-9A-Za-z.-]+)?$ ]] \
    || die "Versión inválida: \"$version\". Usa formato semántico, por ejemplo 0.1.0."
}

require_tools() {
  local tool
  for tool in "$@"; do
    command -v "$tool" >/dev/null 2>&1 || die "No se encontró \"$tool\" en el PATH."
  done
}

# Comprueba el daemon y, si DOCKER_HOST no está definido, lo toma del contexto
# activo de Docker para que el provider de Terraform use el mismo daemon
# (por ejemplo npipe:// en Docker Desktop para Windows).
setup_docker() {
  docker info >/dev/null 2>&1 || die "Docker no responde. Inicia Docker Desktop o el servicio de Docker."
  if [[ -z "${DOCKER_HOST:-}" ]]; then
    DOCKER_HOST="$(docker context inspect --format '{{.Endpoints.docker.Host}}' 2>/dev/null || true)"
    [[ -n "$DOCKER_HOST" ]] && export DOCKER_HOST
  fi
}

image_exists() {
  docker image inspect "$1" >/dev/null 2>&1
}

host_port_for() {
  local env="$1"
  sed -n 's/^[[:space:]]*host_port[[:space:]]*=[[:space:]]*\([0-9]\+\).*/\1/p' \
    "$INFRA_DIR/environments/$env.tfvars"
}

# Inicializa Terraform solo si hace falta. `terraform init` consulta el
# registro aunque los providers ya estén instalados, así que sin internet
# fallaría; si el directorio ya está inicializado y la configuración valida,
# se omite (necesario para la defensa sin conexión, PI-18).
tf_init() {
  if [[ -d "$INFRA_DIR/.terraform/providers" ]] \
     && terraform -chdir="$INFRA_DIR" validate -no-color >/dev/null 2>&1; then
    ok "Terraform ya inicializado (sin acceso a la red)"
  else
    terraform -chdir="$INFRA_DIR" init -input=false >/dev/null
    ok "Terraform inicializado"
  fi
}

# Selecciona el workspace del entorno, creándolo solo si se pide.
select_workspace() {
  local env="$1" create="${2:-no}"
  if terraform -chdir="$INFRA_DIR" workspace select "$env" >/dev/null 2>&1; then
    :
  elif [[ "$create" == "create" ]]; then
    terraform -chdir="$INFRA_DIR" workspace new "$env" >/dev/null
  else
    die "El workspace \"$env\" no existe. Despliega primero con deploy.sh $env VERSION."
  fi
  local current
  current="$(terraform -chdir="$INFRA_DIR" workspace show)"
  [[ "$current" == "$env" ]] || die "Workspace activo \"$current\" distinto de \"$env\"."
  ok "Workspace: $current"
}

# Pide escribir un texto exacto; cualquier otra respuesta cancela.
confirm() {
  local prompt="$1" expected="$2" answer
  read -r -p "$prompt " answer
  [[ "$answer" == "$expected" ]] || die "Operación cancelada."
}

wait_healthy() {
  local container="$1" waited=0 status
  while (( waited < STAGE_TIMEOUT )); do
    status="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$container" 2>/dev/null || echo missing)"
    [[ "$status" == "healthy" ]] && { ok "$container: healthy"; return 0; }
    sleep 3; waited=$((waited + 3))
  done
  docker logs --tail 20 "$container" >&2 || true
  die "$container no está healthy después de ${STAGE_TIMEOUT}s (estado: $status)."
}
