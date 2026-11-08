# Nombre del contenedor, resoluble por el DNS de Docker en la red backend.
# Al ser una referencia al recurso, crea la dependencia implícita API -> BD
# sin depends_on (recrear PostgreSQL no obliga a recrear la API).
output "host" {
  description = "Host de PostgreSQL dentro de la red backend."
  value       = docker_container.postgres.name
}

output "port" {
  description = "Puerto interno de PostgreSQL."
  value       = 5432
}

output "database_name" {
  description = "Nombre de la base de datos de la aplicación."
  value       = local.database_name
}

output "admin_user" {
  description = "Usuario administrativo (inicialización y migraciones)."
  value       = local.admin_user
}

output "app_user" {
  description = "Usuario de aplicación sin privilegios DDL."
  value       = local.app_user
}

output "admin_password" {
  description = "Contraseña administrativa. Solo para la etapa de migración."
  value       = random_password.admin.result
  sensitive   = true
}

output "app_password" {
  description = "Contraseña del usuario de aplicación."
  value       = random_password.app.result
  sensitive   = true
}

output "container_name" {
  description = "Nombre del contenedor de PostgreSQL."
  value       = docker_container.postgres.name
}

output "volume_name" {
  description = "Volumen con los datos del entorno."
  value       = docker_volume.data.name
}
