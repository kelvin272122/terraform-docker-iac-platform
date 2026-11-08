#!/usr/bin/env bash
# Despliega un entorno con Terraform y completa la migración de la base.
# Uso: infra/scripts/deploy.sh ENTORNO VERSION   (ENTORNO: dev | prod)
#
# Etapas: validaciones -> init -> workspace -> plan -> aprobación -> apply
#         -> espera de PostgreSQL -> migraciones -> privilegios -> salud.
# El despliegue solo se da por terminado tras la migración y la salud.

source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

ENVIRONMENT="${1:-}"
VERSION="${2:-}"
require_env "$ENVIRONMENT"
require_version "$VERSION"
require_tools terraform docker curl
setup_docker

PLAN_FILE="$ENVIRONMENT.tfplan"
TF=(terraform -chdir="$INFRA_DIR")
VARS=(-var-file="environments/$ENVIRONMENT.tfvars" -var "application_version=$VERSION")

info "Comprobando imágenes $VERSION"
for image in "iac-panel-web:$VERSION" "iac-panel-api:$VERSION" "iac-panel-api-migrate:$VERSION" "$POSTGRES_IMAGE"; do
  image_exists "$image" || die "Falta la imagen $image. Ejecuta primero: infra/scripts/build-images.sh $VERSION"
done
ok "Imágenes presentes"

info "Inicializando Terraform"
tf_init
select_workspace "$ENVIRONMENT" create

info "Generando plan para $ENVIRONMENT"
"${TF[@]}" plan -input=false "${VARS[@]}" -out="$PLAN_FILE"

confirm "¿Aplicar este plan en \"$ENVIRONMENT\"? Escribe \"si\" para continuar:" "si"

POSTGRES_CONTAINER="iac-panel-$ENVIRONMENT-postgres"

# Asegura que el rol de aplicación exista y use la contraseña vigente del
# estado. Normalmente lo crea el script de inicialización del volumen; esta
# etapa es idempotente y repara el caso en que ese script no se ejecutó.
# Las credenciales se leen del entorno del propio contenedor, no de argumentos.
ensure_app_role() {
  docker exec -i "$POSTGRES_CONTAINER" bash -c \
    'psql -v ON_ERROR_STOP=1 -q -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v app_user="$APP_DB_USER" -v app_password="$APP_DB_PASSWORD"' <<'SQL'
SELECT format('CREATE ROLE %I LOGIN PASSWORD %L NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION',
              :'app_user', :'app_password')
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = :'app_user')
\gexec
SELECT format('ALTER ROLE %I WITH LOGIN PASSWORD %L', :'app_user', :'app_password')
\gexec
SQL
}

info "Aplicando plan"
if ! "${TF[@]}" apply -input=false "$PLAN_FILE"; then
  rm -f "$INFRA_DIR/$PLAN_FILE"
  # Si la base quedó en pie, se reconcilia el rol para que el siguiente intento
  # pueda completar el despliegue sin borrar datos.
  if docker inspect "$POSTGRES_CONTAINER" >/dev/null 2>&1 && ensure_app_role; then
    warn "Se reconcilió el rol de aplicación en PostgreSQL."
  fi
  die "terraform apply falló. Revisa el error y vuelve a ejecutar deploy.sh; no se borraron volúmenes ni el estado."
fi
rm -f "$INFRA_DIR/$PLAN_FILE"

BACKEND_NETWORK="$("${TF[@]}" output -json networks | sed -n 's/.*"backend":"\([^"]*\)".*/\1/p')"
DB_NAME="$("${TF[@]}" output -raw database_name)"
DB_ADMIN="$("${TF[@]}" output -raw database_admin_user)"
DB_APP="$("${TF[@]}" output -raw database_app_user)"
URL="$("${TF[@]}" output -raw url)"

info "Esperando PostgreSQL"
wait_healthy "$POSTGRES_CONTAINER"

info "Reconciliando el rol de aplicación"
ensure_app_role || die "No se pudo asegurar el rol de aplicación."
ok "Rol $DB_APP listo"

info "Ejecutando migraciones (credenciales administrativas solo en esta etapa)"
# La URL se pasa por variable de entorno heredada, no como argumento visible.
MIGRATION_DATABASE_URL="postgresql://$DB_ADMIN:$("${TF[@]}" output -raw database_admin_password)@postgres:5432/$DB_NAME"
export MIGRATION_DATABASE_URL
if ! docker run --rm --network "$BACKEND_NETWORK" -e MIGRATION_DATABASE_URL "iac-panel-api-migrate:$VERSION"; then
  unset MIGRATION_DATABASE_URL
  die "La migración falló. El despliegue queda INCOMPLETO; los datos se conservan. Corrige y vuelve a ejecutar deploy.sh."
fi
unset MIGRATION_DATABASE_URL
ok "Migraciones aplicadas"

info "Aplicando privilegios del usuario de aplicación"
docker exec -i "$POSTGRES_CONTAINER" \
  psql -v ON_ERROR_STOP=1 -q -U "$DB_ADMIN" -d "$DB_NAME" \
  -v database_name="$DB_NAME" -v app_user="$DB_APP" \
  < "$REPO_ROOT/app/database/scripts/grant-app-privileges.sql" \
  || die "No se pudieron aplicar los privilegios. El despliegue queda INCOMPLETO."
ok "Privilegios aplicados"

info "Comprobando salud a través de NGINX"
waited=0
until curl -fsS --max-time 5 "$URL/api/health" >/dev/null 2>&1; do
  (( waited >= STAGE_TIMEOUT )) && die "La aplicación no respondió sana en ${STAGE_TIMEOUT}s: $URL/api/health"
  sleep 3; waited=$((waited + 3))
done
ok "$(curl -fsS --max-time 5 "$URL/api/health")"

info "Despliegue de $ENVIRONMENT completo: $URL"
