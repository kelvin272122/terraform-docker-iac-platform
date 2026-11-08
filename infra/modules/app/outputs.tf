output "url" {
  description = "URL local de la aplicación."
  value       = "http://127.0.0.1:${var.host_port}"
}

output "api_container_name" {
  description = "Nombre del contenedor de la API."
  value       = docker_container.api.name
}

output "web_container_name" {
  description = "Nombre del contenedor de NGINX."
  value       = docker_container.web.name
}

output "api_image_id" {
  description = "ID de la imagen de la API en uso."
  value       = data.docker_image.api.id
}

output "web_image_id" {
  description = "ID de la imagen web en uso."
  value       = data.docker_image.web.id
}
