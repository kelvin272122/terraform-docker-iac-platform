locals {
  database_name = "iac_panel"
  admin_user    = "iac_admin"
  app_user      = "iac_app"

  # Se ejecuta una sola vez, cuando PostgreSQL inicializa un volumen vacío.
  # Crea el rol de aplicación sin privilegios administrativos; los permisos
  # sobre las tablas se otorgan después de migrar (grant-app-privileges.sql).
  init_script = <<-SCRIPT
    #!/bin/bash
    set -euo pipefail
    psql -v ON_ERROR_STOP=1 \
      --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" \
      -v app_user="$APP_DB_USER" -v app_password="$APP_DB_PASSWORD" <<'SQL'
    SELECT format(
      'CREATE ROLE %I LOGIN PASSWORD %L NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION',
      :'app_user', :'app_password'
    )
    WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = :'app_user')
    \gexec
    SQL
  SCRIPT
}

# Contraseñas independientes por entorno. Sin caracteres especiales para que
# puedan usarse en una URL de conexión sin codificar.
resource "random_password" "admin" {
  length  = 32
  special = false
}

resource "random_password" "app" {
  length  = 32
  special = false
}

data "docker_image" "postgres" {
  name = var.image
}

resource "docker_volume" "data" {
  name = "${var.prefix}-pgdata"

  dynamic "labels" {
    for_each = var.labels
    content {
      label = labels.key
      value = labels.value
    }
  }
}

resource "docker_container" "postgres" {
  name    = "${var.prefix}-postgres"
  image   = data.docker_image.postgres.id
  restart = "unless-stopped"

  env = [
    "POSTGRES_DB=${local.database_name}",
    "POSTGRES_USER=${local.admin_user}",
    "POSTGRES_PASSWORD=${random_password.admin.result}",
    "APP_DB_USER=${local.app_user}",
    "APP_DB_PASSWORD=${random_password.app.result}",
  ]

  # Sin bloque ports: PostgreSQL no se publica en el host (RI-02).
  networks_advanced {
    name    = var.backend_network
    aliases = ["postgres"]
  }

  volumes {
    volume_name    = docker_volume.data.name
    container_path = "/var/lib/postgresql/data"
  }

  upload {
    file = "/docker-entrypoint-initdb.d/10-app-role.sh"
    # Sin "\r": si el repositorio se clona en Windows con CRLF, bash fallaría.
    content     = replace(local.init_script, "\r", "")
    permissions = "0755"
  }

  # memory_swap igual a memory: sin swap y sin deriva en el plan (Docker
  # asigna por defecto el doble de la memoria si no se fija).
  memory        = 512
  memory_swap   = 512
  security_opts = ["no-new-privileges:true"]

  healthcheck {
    # Por TCP: durante la inicialización PostgreSQL solo escucha en el socket
    # local, así que la comprobación no pasa hasta que el servidor final arranca.
    test         = ["CMD-SHELL", "pg_isready -h 127.0.0.1 -p 5432 -U \"$POSTGRES_USER\" -d \"$POSTGRES_DB\""]
    interval     = "5s"
    timeout      = "3s"
    retries      = 12
    start_period = "10s"
  }

  # Terraform espera a que el contenedor esté healthy antes de continuar.
  wait         = true
  wait_timeout = 120

  dynamic "labels" {
    for_each = merge(var.labels, { "com.iac-panel.component" = "database" })
    content {
      label = labels.key
      value = labels.value
    }
  }
}
