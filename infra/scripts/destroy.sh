#!/usr/bin/env bash
# Destruye por completo UN entorno: contenedores, redes y volumen con sus datos.
# Uso: infra/scripts/destroy.sh ENTORNO   (ENTORNO: dev | prod)
# No elimina las imágenes compartidas ni recursos de otros entornos.

source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

ENVIRONMENT="${1:-}"
require_env "$ENVIRONMENT"
require_tools terraform docker
setup_docker

PLAN_FILE="$ENVIRONMENT-destroy.tfplan"
TF=(terraform -chdir="$INFRA_DIR")

"${TF[@]}" init -input=false >/dev/null
select_workspace "$ENVIRONMENT"

# La versión desplegada se lee del estado para que el plan use las mismas imágenes.
VERSION="$("${TF[@]}" output -raw application_version 2>/dev/null || true)"
[[ -n "$VERSION" ]] || die "No hay un despliegue de $ENVIRONMENT en el estado."

info "Plan de destrucción de $ENVIRONMENT"
"${TF[@]}" plan -destroy -input=false \
  -var-file="environments/$ENVIRONMENT.tfvars" -var "application_version=$VERSION" \
  -out="$PLAN_FILE"

warn "Se eliminarán los contenedores, las redes y el volumen iac-panel-$ENVIRONMENT-pgdata."
warn "TODOS LOS DATOS de $ENVIRONMENT se perderán de forma permanente."
confirm "Para confirmar escribe el nombre del entorno ($ENVIRONMENT):" "$ENVIRONMENT"

if ! "${TF[@]}" apply -input=false "$PLAN_FILE"; then
  rm -f "$INFRA_DIR/$PLAN_FILE"
  die "La destrucción falló; revisa el error. No edites el estado manualmente."
fi
rm -f "$INFRA_DIR/$PLAN_FILE"
info "Entorno $ENVIRONMENT destruido. Las imágenes compartidas se conservan."
