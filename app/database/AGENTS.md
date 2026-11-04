# Base de datos

## 1. Reglas importantes

- Respeta el AGENTS.md raíz.
- Esta carpeta controla esquema, migraciones y datos iniciales.
- El contenedor, volumen y redes se administran desde infra/.
- Usa PostgreSQL 17 y node-pg-migrate según la arquitectura aprobada.
- Mantén migraciones SQL versionadas y ejecutables por el mecanismo elegido.
- Respeta campos, restricciones y reglas de datos documentados.
- No agregues tablas funcionales ni relaciones sin aprobación.

### Migraciones
- Cada cambio de esquema debe tener una migración identificable.
- No alteres silenciosamente una migración ya aplicada.
- Ejecutar nuevamente sin cambios pendientes no debe duplicar datos.
- No uses borrado de volumen como mecanismo de actualización.
- No ejecutes rollback, truncado o eliminación de datos sin autorización.
- Identifica expresamente las operaciones destructivas.
- Si una migración falla, conserva los datos y registra el bloqueo.
- No conviertas seeds en un requisito para que la aplicación funcione.

### Credenciales y datos
- Separa credenciales administrativas y de aplicación.
- La aplicación solo necesita permisos de conexión y CRUD aprobados.
- No guardes secretos ni dumps en Git.
- La base inicial comienza vacía.
- Los seeds son opcionales, explícitos y de demostración.
- No introduzcas datos privados o reales.

### Validación
- Prueba migración inicial sobre una base descartable vacía.
- Comprueba reejecución sin migraciones pendientes.
- Verifica restricciones y permisos del usuario de aplicación.
- No declares persistencia validada sin realizar la prueba correspondiente.
- Aplica el cierre definido en el AGENTS.md raíz.

## 2. Ubicaciones relevantes

Rutas desde la raíz:
- app/database/migrations/: cambios de esquema.
- app/database/seeds/: datos opcionales.
- app/backend/package.json: comando de migración.
- app/backend/AGENTS.md: integración y acceso a datos.
- infra/modules/database/: recursos Terraform de PostgreSQL.
- infra/AGENTS.md: consultar antes de modificar infraestructura.
- docs/arquitectura.md: modelo y permisos.
- docs/despliegue.md: inicialización y operación.
- docs/pruebas.md: pruebas de datos y persistencia.
- docs/AGENTS.md: documentación.