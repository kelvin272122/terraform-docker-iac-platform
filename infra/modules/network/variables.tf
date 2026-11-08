variable "prefix" {
  description = "Prefijo de nombres del entorno (iac-panel-<entorno>)."
  type        = string
}

variable "labels" {
  description = "Etiquetas comunes del proyecto."
  type        = map(string)
}
