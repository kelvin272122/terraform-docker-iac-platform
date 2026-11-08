variable "prefix" {
  description = "Prefijo de nombres del entorno (iac-panel-<entorno>)."
  type        = string
}

variable "labels" {
  description = "Etiquetas comunes del proyecto."
  type        = map(string)
}

variable "environment" {
  description = "Entorno (dev o prod), expuesto por la API en /api/info."
  type        = string
}

variable "application_version" {
  description = "Versión de la aplicación (APP_VERSION)."
  type        = string
}

variable "api_image" {
  description = "Imagen local de la API (iac-panel-api:<versión>)."
  type        = string
}

variable "web_image" {
  description = "Imagen local de NGINX con el frontend (iac-panel-web:<versión>)."
  type        = string
}

variable "host_port" {
  description = "Puerto de 127.0.0.1 publicado por NGINX."
  type        = number
}

variable "frontend_network" {
  description = "Nombre de la red frontend."
  type        = string
}

variable "backend_network" {
  description = "Nombre de la red backend interna."
  type        = string
}

variable "db_host" {
  description = "Host de PostgreSQL en la red backend."
  type        = string
}

variable "db_name" {
  description = "Base de datos de la aplicación."
  type        = string
}

variable "db_user" {
  description = "Usuario de aplicación."
  type        = string
}

variable "db_password" {
  description = "Contraseña del usuario de aplicación."
  type        = string
  sensitive   = true
}
