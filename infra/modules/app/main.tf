# Las imágenes se construyen antes con scripts/build-images.sh; Terraform no
# las construye ni las descarga. Si faltan, el plan falla con un error claro.
data "docker_image" "api" {
  name = var.api_image
}

data "docker_image" "web" {
  name = var.web_image
}

locals {
  common_labels = var.labels
}

resource "docker_container" "api" {
  name    = "${var.prefix}-api"
  image   = data.docker_image.api.id # ID de la imagen: un build nuevo recrea el contenedor
  restart = "unless-stopped"

  # La API recibe solo credenciales de aplicación, nunca las administrativas.
  env = [
    "APP_ENV=${var.environment}",
    "APP_VERSION=${var.application_version}",
    "PORT=3000",
    "DB_HOST=${var.db_host}",
    "DB_PORT=5432",
    "DB_NAME=${var.db_name}",
    "DB_USER=${var.db_user}",
    "DB_PASSWORD=${var.db_password}",
  ]

  # Sin bloque ports: la API no se publica en el host (RI-02).
  networks_advanced {
    name    = var.frontend_network
    aliases = ["api"] # NGINX proxifica hacia api:3000
  }

  networks_advanced {
    name = var.backend_network
  }

  read_only     = true
  tmpfs         = { "/tmp" = "rw,noexec,nosuid,size=64m" }
  security_opts = ["no-new-privileges:true"]
  memory        = 256
  memory_swap   = 256 # igual a memory: sin swap y sin deriva en el plan

  capabilities {
    drop = ["ALL"]
  }

  healthcheck {
    # La imagen no incluye curl ni wget; se usa el fetch nativo de Node.
    test         = ["CMD", "node", "-e", "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]
    interval     = "10s"
    timeout      = "5s"
    retries      = 6
    start_period = "10s"
  }

  wait         = true
  wait_timeout = 120

  dynamic "labels" {
    for_each = merge(local.common_labels, { "com.iac-panel.component" = "api" })
    content {
      label = labels.key
      value = labels.value
    }
  }
}

resource "docker_container" "web" {
  name    = "${var.prefix}-web"
  image   = data.docker_image.web.id
  restart = "unless-stopped"

  # Único puerto publicado del entorno, ligado solo a loopback (RI-03).
  ports {
    internal = 8080
    external = var.host_port
    ip       = "127.0.0.1"
  }

  networks_advanced {
    name = var.frontend_network
  }

  read_only     = true
  tmpfs         = { "/tmp" = "rw,nosuid,size=32m" }
  security_opts = ["no-new-privileges:true"]
  memory        = 128
  memory_swap   = 128

  capabilities {
    drop = ["ALL"]
  }

  healthcheck {
    test         = ["CMD", "wget", "-q", "-O", "/dev/null", "http://127.0.0.1:8080/"]
    interval     = "10s"
    timeout      = "3s"
    retries      = 6
    start_period = "5s"
  }

  wait         = true
  wait_timeout = 120

  dynamic "labels" {
    for_each = merge(local.common_labels, { "com.iac-panel.component" = "web" })
    content {
      label = labels.key
      value = labels.value
    }
  }
}
