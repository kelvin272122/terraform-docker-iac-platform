variable "environment" {
  description = "Entorno a desplegar. Debe coincidir con el workspace seleccionado."
  type        = string

  validation {
    condition     = contains(["dev", "prod"], var.environment)
    error_message = "environment debe ser \"dev\" o \"prod\"."
  }
}

variable "host_port" {
  description = "Puerto de 127.0.0.1 donde NGINX publica la aplicación."
  type        = number

  validation {
    condition     = var.host_port >= 1024 && var.host_port <= 65535 && floor(var.host_port) == var.host_port
    error_message = "host_port debe ser un entero entre 1024 y 65535."
  }
}

variable "application_version" {
  description = "Versión de las imágenes de la aplicación (etiqueta construida con build-images.sh)."
  type        = string

  validation {
    condition     = can(regex("^[0-9]+\\.[0-9]+\\.[0-9]+([-.][0-9A-Za-z.-]+)?$", var.application_version))
    error_message = "application_version debe tener formato semántico, por ejemplo 0.1.0."
  }
}

variable "postgres_image" {
  description = "Imagen de PostgreSQL fijada por etiqueta y digest."
  type        = string
  default     = "postgres:17.11-bookworm@sha256:665dc7b37ac52a17e298511414c21d23ffa4e6a6ef6225b3e5d59c7afb35e994"

  validation {
    condition     = can(regex("@sha256:[0-9a-f]{64}$", var.postgres_image))
    error_message = "postgres_image debe estar fijada por digest (@sha256:...)."
  }
}

variable "docker_host" {
  description = "Endpoint del daemon Docker. null usa DOCKER_HOST o el valor por defecto del provider."
  type        = string
  default     = null
}
