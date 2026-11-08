terraform {
  required_version = ">= 1.9.0, < 2.0.0"

  required_providers {
    docker = {
      source  = "kreuzwerker/docker"
      version = "~> 4.6"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.9"
    }
  }

  # Estado local por workspace: terraform.tfstate.d/<workspace>/ (no versionado).
  backend "local" {}
}

# Sin host explícito, el provider usa DOCKER_HOST o el socket por defecto.
# En Windows con Docker Desktop, los scripts exportan DOCKER_HOST si hace falta.
provider "docker" {
  host = var.docker_host
}
