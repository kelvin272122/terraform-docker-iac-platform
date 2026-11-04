# Backend

## 1. Reglas importantes

- Respeta el AGENTS.md raíz.
- Usa Node.js 24, Express 5, TypeScript estricto y módulos ES.
- Usa pg con pool de conexiones; no incorpores ORM sin aprobación.
- Organiza rutas, validación, servicios y repositorios por funcionalidad.
- Respeta exactamente el contrato API documentado.
- No añadas endpoints, campos o cambios incompatibles sin aprobación.

### Datos y seguridad
- Valida entradas en el servidor, aunque el frontend ya las valide.
- Usa consultas parametrizadas; no concatenes entradas en SQL.
- Rechaza campos desconocidos cuando así lo establece el contrato.
- Obtén configuración y credenciales del entorno.
- No devuelvas secretos, SQL interno ni stack traces al cliente.
- Registra información operativa en stdout/stderr sin datos privados.
- Usa credenciales de aplicación sin privilegios administrativos.
- No ejecutes migraciones desde peticiones HTTP.
- No ejecutes Terraform ni accedas al socket Docker desde la API.

### Comportamiento
- Implementa errores HTTP y JSON consistentes con arquitectura.md.
- Distingue disponibilidad de API y disponibilidad de PostgreSQL.
- Aplica límites de solicitudes y tiempos de espera documentados.
- Cierra servidor y conexiones ordenadamente ante SIGTERM.
- No borres ni reinicialices datos al arrancar.
- No ocultes fallos con respuestas simuladas.

### Validación
- Implementa pruebas de validación, respuestas y errores.
- Usa PostgreSQL de prueba para verificaciones de integración.
- No ejecutes pruebas destructivas sobre prod.
- Ejecuta compilación y pruebas aplicables.
- Aplica el cierre definido en el AGENTS.md raíz.

## 2. Ubicaciones relevantes

Rutas desde la raíz:
- app/backend/src/: implementación.
- app/backend/tests/: pruebas.
- app/backend/package.json: scripts y dependencias.
- app/backend/.env.example: configuración sin secretos.
- app/database/AGENTS.md: migraciones y esquema.
- docs/requerimientos.md: reglas de negocio.
- docs/arquitectura.md: endpoints, errores y modelo de datos.
- docs/pruebas.md: casos obligatorios.
- docs/AGENTS.md: documentación.