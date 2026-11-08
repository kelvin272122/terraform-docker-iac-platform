#!/usr/bin/env bash
# Construye las imágenes de la aplicación con una etiqueta de versión.
# Uso: infra/scripts/build-images.sh VERSION
# Es una etapa previa y separada de Terraform: Terraform no construye imágenes.

source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

VERSION="${1:-}"
require_version "$VERSION"
require_tools docker
setup_docker

# La versión embebida debe coincidir con la etiqueta.
for pkg in app/frontend/package.json app/backend/package.json; do
  pkg_version="$(sed -n 's/^[[:space:]]*"version":[[:space:]]*"\([^"]*\)".*/\1/p' "$REPO_ROOT/$pkg" | head -1)"
  [[ "$pkg_version" == "$VERSION" ]] \
    || die "$pkg declara la versión $pkg_version; actualízala antes de construir $VERSION."
done

if ! image_exists "$POSTGRES_IMAGE"; then
  info "Descargando la imagen fijada de PostgreSQL"
  docker pull "$POSTGRES_IMAGE"
fi

build() {
  local tag="$1" dockerfile="$2" target="$3"
  # No se reconstruye contenido distinto bajo una etiqueta existente.
  if image_exists "$tag"; then
    ok "$tag ya existe; se conserva (usa una versión nueva para otro build)."
    return
  fi
  info "Construyendo $tag (target $target)"
  docker build --platform linux/amd64 \
    -f "$REPO_ROOT/$dockerfile" --target "$target" \
    --label "org.opencontainers.image.version=$VERSION" \
    --label "com.iac-panel.project=iac-panel" \
    -t "$tag" "$REPO_ROOT"
  ok "$tag"
}

build "iac-panel-web:$VERSION"         app/frontend/Dockerfile runtime
build "iac-panel-api:$VERSION"         app/backend/Dockerfile  runtime
build "iac-panel-api-migrate:$VERSION" app/backend/Dockerfile  migration

info "Imágenes disponibles:"
docker image ls --format '  {{.Repository}}:{{.Tag}}  {{.ID}}  {{.Size}}' \
  --filter "reference=iac-panel-*:$VERSION"
