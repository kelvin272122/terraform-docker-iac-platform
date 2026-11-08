# Red frontend: NGINX y API. No es interna porque NGINX publica un puerto.
resource "docker_network" "frontend" {
  name   = "${var.prefix}-frontend-net"
  driver = "bridge"

  dynamic "labels" {
    for_each = var.labels
    content {
      label = labels.key
      value = labels.value
    }
  }

  # IPv6 depende del daemon: Docker Desktop lo activa por defecto y Docker
  # Engine en Linux no. El provider no puede forzarlo a false, así que se
  # ignora para no recrear las redes en cada plan. El laboratorio usa IPv4.
  lifecycle {
    ignore_changes = [ipv6]
  }
}

# Red backend: API y PostgreSQL. Interna: sin salida a internet ni acceso
# desde el host; PostgreSQL solo es alcanzable por la API.
resource "docker_network" "backend" {
  name     = "${var.prefix}-backend-net"
  driver   = "bridge"
  internal = true

  dynamic "labels" {
    for_each = var.labels
    content {
      label = labels.key
      value = labels.value
    }
  }

  # Ver la nota de IPv6 en la red frontend.
  lifecycle {
    ignore_changes = [ipv6]
  }
}
