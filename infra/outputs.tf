output "environment" {
  description = "Entorno desplegado."
  value       = var.environment
}

output "application_version" {
  description = "Versión de las imágenes desplegadas."
  value       = var.application_version
}

output "url" {
  description = "URL local de la aplicación (solo 127.0.0.1)."
  value       = module.app.url
}

output "containers" {
  description = "Contenedores del entorno."
  value = {
    web      = module.app.web_container_name
    api      = module.app.api_container_name
    database = module.database.container_name
  }
}

output "networks" {
  description = "Redes del entorno."
  value = {
    frontend = module.network.frontend_network_name
    backend  = module.network.backend_network_name
  }
}

output "volume" {
  description = "Volumen persistente de PostgreSQL."
  value       = module.database.volume_name
}

output "database_name" {
  description = "Base de datos de la aplicación."
  value       = module.database.database_name
}

output "database_admin_user" {
  description = "Usuario administrativo, usado solo por la etapa de migración."
  value       = module.database.admin_user
}

output "database_app_user" {
  description = "Usuario de aplicación."
  value       = module.database.app_user
}

# Lo lee deploy.sh con `terraform output -raw` para la migración; no se imprime.
output "database_admin_password" {
  description = "Contraseña administrativa (sensible)."
  value       = module.database.admin_password
  sensitive   = true
}
