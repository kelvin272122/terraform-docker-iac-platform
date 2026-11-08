variable "prefix" {
  description = "Prefijo de nombres del entorno (iac-panel-<entorno>)."
  type        = string
}

variable "labels" {
  description = "Etiquetas comunes del proyecto."
  type        = map(string)
}

variable "image" {
  description = "Imagen de PostgreSQL fijada por digest. Debe existir localmente."
  type        = string
}

variable "backend_network" {
  description = "Nombre de la red backend interna."
  type        = string
}
