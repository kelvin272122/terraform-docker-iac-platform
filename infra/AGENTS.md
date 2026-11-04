# Infraestructura

## 1. Reglas importantes

- Respeta el AGENTS.md raíz.
- Terraform administra la infraestructura local sobre Docker.
- Usa módulos network, database y app.
- No sustituyas el despliegue por docker run o Docker Compose.
- La construcción previa de imágenes es una etapa separada.
- No cambies la estrategia de despliegue sin aprobación.

### Entornos y estado
- Usa exclusivamente workspaces dev y prod.
- No despliegues en default.
- Comprueba coincidencia entre workspace, tfvars y entorno solicitado.
- Usa nombres, redes, volúmenes y puertos diferenciados.
- Impide colisiones entre entornos.
- No elimines ni edites manualmente el estado para resolver errores.
- No ejecutes operaciones concurrentes sobre el mismo estado.
- No versiones estados, planes ni secretos.
- Versiona .terraform.lock.hcl.

### Recursos y seguridad
- Solo NGINX publica un puerto, ligado a 127.0.0.1.
- API y PostgreSQL no publican puertos al host.
- Respeta membresías de redes y red backend interna.
- Usa credenciales independientes por entorno.
- Protege valores sensibles; no presupongas que sensitive cifra el estado.
- No modifiques recursos Docker ajenos al proyecto.
- No uses imágenes latest ni etiquetas mutables para builds distintos.
- No montes el socket Docker dentro de la aplicación.

### Ejecución
- Preparar código no autoriza a ejecutar apply o destroy.
- Solicita autorización para desplegar, migrar datos existentes o destruir.
- Muestra el plan y explica cambios relevantes antes de aplicarlo.
- No uses auto-approve para evitar confirmaciones.
- Las migraciones se ejecutan como etapa explícita y controlada.
- El despliegue solo termina tras migración y comprobaciones de salud.
- No asumas disponibilidad solo por el orden de creación.
- Un error no autoriza a borrar volúmenes ni credenciales.
- La destrucción debe advertir la pérdida de datos del entorno seleccionado.

### Validación
- Ejecuta formato y validación de Terraform cuando sea posible.
- Verifica sintaxis y errores de scripts.
- Registra por separado pruebas estáticas y pruebas realmente desplegadas.
- Drift, cambios destructivos y recuperación se prueban en dev.
- Aplica el cierre definido en el AGENTS.md raíz.

## 2. Ubicaciones relevantes

Rutas desde la raíz:
- infra/main.tf: composición.
- infra/providers.tf: herramientas y providers.
- infra/variables.tf: entradas y validaciones.
- infra/outputs.tf: salidas.
- infra/environments/: configuración por entorno.
- infra/modules/network/: redes.
- infra/modules/database/: PostgreSQL y volumen.
- infra/modules/app/: API y NGINX.
- infra/scripts/: construcción, despliegue y pruebas.
- app/database/AGENTS.md: esquema y migraciones.
- app/nginx/AGENTS.md: proxy y HTTP.
- docs/arquitectura.md: diseño aprobado.
- docs/despliegue.md: procedimiento.
- docs/pruebas.md: verificaciones.
- docs/AGENTS.md: documentación.