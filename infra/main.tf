locals {
  prefix = "iac-panel-${var.environment}"

  # Etiquetas comunes: permiten identificar los recursos del proyecto
  # y no confundirlos con recursos Docker ajenos (RI-10).
  labels = {
    "com.iac-panel.project"     = "iac-panel"
    "com.iac-panel.environment" = var.environment
    "com.iac-panel.managed-by"  = "terraform"
  }

  api_image = "iac-panel-api:${var.application_version}"
  web_image = "iac-panel-web:${var.application_version}"
}

# Bloquea el plan si el workspace no coincide con el entorno de las variables
# (por ejemplo, prod.tfvars en el workspace dev) o si se usa "default".
resource "terraform_data" "workspace_guard" {
  input = var.environment

  lifecycle {
    precondition {
      condition     = terraform.workspace == var.environment
      error_message = "El workspace \"${terraform.workspace}\" no coincide con environment = \"${var.environment}\". Selecciona el workspace correcto (dev o prod) y su archivo environments/<entorno>.tfvars."
    }
  }
}

module "network" {
  source = "./modules/network"

  prefix = local.prefix
  labels = local.labels
}

module "database" {
  source = "./modules/database"

  prefix          = local.prefix
  labels          = local.labels
  image           = var.postgres_image
  backend_network = module.network.backend_network_name
}

module "app" {
  source = "./modules/app"

  prefix              = local.prefix
  labels              = local.labels
  environment         = var.environment
  application_version = var.application_version
  api_image           = local.api_image
  web_image           = local.web_image
  host_port           = var.host_port

  frontend_network = module.network.frontend_network_name
  backend_network  = module.network.backend_network_name

  db_host     = module.database.host
  db_name     = module.database.database_name
  db_user     = module.database.app_user
  db_password = module.database.app_password
}
