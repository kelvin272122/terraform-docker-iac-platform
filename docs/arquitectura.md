# Arquitectura — Panel de verificación IaC

## 1. Estado del documento

Especificación de implementación.
No constituye evidencia de que el sistema ya haya sido construido o probado.

## 2. Componentes

Navegador -> NGINX -> API Express -> PostgreSQL

- Angular: interfaz y presentación.
- NGINX: archivos estáticos y proxy /api.
- Express: validaciones, consultas, información y comprobaciones de salud.
- PostgreSQL: registros y control de migraciones.
- Terraform: redes, volumen y contenedores.
- Docker: construcción y ejecución de imágenes.

## 3. Redes

Por entorno:
- frontend_net: NGINX y API.
- backend_net: API y PostgreSQL.
- backend_net configurada como red interna.
- NGINX no se conecta a backend_net.
- PostgreSQL no se conecta a frontend_net.

Puertos:
- NGINX: 80 interno.
- API: 3000 interno.
- PostgreSQL: 5432 interno.
- dev: 127.0.0.1:8080.
- prod: 127.0.0.1:8081.

Los contenedores se comunican por nombres o alias de red, no por localhost.

## 4. Frontend

- Angular 21 y Angular Material 21.
- Componentes standalone.
- TypeScript estricto; no usar any para evitar tipar el contrato.
- Formularios reactivos.
- SCSS y variables visuales compartidas.
- Servicios HTTP y modelos separados de los componentes.
- Estado local mediante signals cuando corresponda.
- Sin biblioteca global de estado.
- URL de API relativa: /api.
- Proxy del servidor de desarrollo hacia Express.
- Navegación SPA con fallback de NGINX.
- No aplicar fallback HTML a errores de /api.
- Angular se implementa en modo zoneless.
- No incorporar zone.js ni activar detección basada en Zone sin una
  necesidad justificada y aprobada.

Organización:
- core/: configuración, modelos y servicios compartidos.
- shared/: componentes visuales reutilizables.
- features/status/: estado del despliegue.
- features/records/: gestión de registros.

Decisiones visuales de la primera interfaz:
- Paleta clara aprobada: fondo #f6f7f9, superficie #ffffff, texto #1f2933,
  texto secundario #52606d, principal #1e3a5f, borde #d9dee5 y foco #2f5d8a.
- Tipografía del sistema, sin fuentes ni iconos externos.
- Logo SVG local sencillo, sin representar una comprobación real de salud.
- Navegación lateral «Estado» y «Registros»; en escritorio desde 960 px y en
  móvil con panel temporal cerrado inicialmente.
- Estados sin integración: textos neutrales de «Pendiente de integración» o
  «Sin comprobaciones realizadas», sin métricas ni indicadores ficticios.

Simulación:
- Permitida explícitamente durante desarrollo aislado del frontend.
- Debe identificarse visualmente como modo simulado.
- Debe respetar exactamente el contrato.
- No se activa automáticamente ante fallos.
- Prohibida en la demostración integrada.

## 5. Backend

- Node.js 24, Express 5 y TypeScript.
- Módulos ES.
- Organización por funcionalidad.
- Capas: rutas, validación, servicio y repositorio.
- pg con pool de conexiones.
- Consultas parametrizadas.
- Middleware central de errores.
- Límite JSON: 16 KiB.
- Tiempo máximo de consulta a BD: 3 segundos.
- Timeout frontend: 8 segundos.
- Sin reintentos automáticos para crear o eliminar.
- Logs en stdout/stderr, sin secretos.
- Cierre ordenado del servidor y pool ante SIGTERM.

Variables:
- APP_ENV: dev o prod.
- APP_VERSION: etiqueta de la versión.
- PORT: 3000.
- DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD.

Instancia:
- Usar hostname del contenedor como identificador diagnóstico.
- No representar ese identificador como inventario completo de Docker.

## 6. Modelo de datos

Tabla records:
- id UUID PRIMARY KEY, generado por Node.
- title VARCHAR(100) NOT NULL.
- description VARCHAR(500) NULL.
- created_at TIMESTAMPTZ NOT NULL DEFAULT now().

Restricciones:
- Título no vacío después de quitar espacios.
- Validación de tipos y longitudes antes de insertar.
- Sin entidades de usuarios.
- Sin relaciones adicionales.

Tabla adicional técnica:
- Historial gestionado por la herramienta de migraciones.

## 7. Contrato API v1

Todas las respuestas de datos usan JSON.
Todas las fechas transmitidas usan UTC ISO 8601.
Sin autenticación.
Campos desconocidos en creación: rechazados.
Métodos no implementados no forman parte del contrato.

### GET /api/info
200:
{
  "environment": "dev",
  "apiVersion": "v1",
  "instanceId": "hostname-del-contenedor"
}

No depende de una consulta a PostgreSQL.

### GET /api/health
Ejecuta SELECT 1 usando las credenciales de aplicación.

200:
{
  "status": "ok",
  "api": "up",
  "database": "up",
  "checkedAt": "2026-11-04T15:30:00Z"
}

503, cuando API responde pero PostgreSQL falla:
{
  "status": "degraded",
  "api": "up",
  "database": "down",
  "checkedAt": "2026-11-04T15:30:00Z"
}

No devuelve SQL, credenciales ni stack traces.

### GET /api/records
200:
{
  "items": [
    {
      "id": "UUID",
      "title": "Prueba",
      "description": null,
      "createdAt": "2026-11-04T15:30:00Z"
    }
  ],
  "total": 1
}

Sin paginación en esta versión.

### POST /api/records
Entrada:
{
  "title": "Prueba",
  "description": "Opcional"
}

201: objeto creado con id, title, description y createdAt.
400: JSON, campos o valores inválidos.
503: dependencia BD no disponible.

### DELETE /api/records/:id
204: eliminado; cuerpo vacío.
400: identificador inválido.
404: registro inexistente.
503: dependencia BD no disponible.

### Errores generales
Formato:
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Revisa los datos enviados.",
    "fields": {
      "title": "El título es obligatorio."
    }
  }
}

fields es opcional.

Códigos:
- VALIDATION_ERROR: 400.
- RECORD_NOT_FOUND: 404.
- DATABASE_UNAVAILABLE: 503.
- INTERNAL_ERROR: 500.

Las rutas /api desconocidas devuelven 404 JSON.

## 8. Migraciones y credenciales

- node-pg-migrate; versiones exactas bloqueadas con npm.
- Migraciones SQL versionadas en app/database/migrations/.
- La imagen API incorpora migraciones y su ejecutor.
- Ejecutar npm run db:migrate mediante un paso explícito de despliegue.
- Reejecutar sin migraciones pendientes no modifica datos.
- No ejecutar migraciones desde solicitudes HTTP.
- No borrar datos ni revertir automáticamente.

Credenciales:
- Administrador para inicialización y migración.
- Usuario de aplicación separado, sin superusuario ni permisos DDL.
- Usuario de aplicación con permisos de conexión y CRUD sobre records.
- La API en ejecución recibe solo credenciales de aplicación.
- La migración recibe credenciales administrativas únicamente durante su ejecución.

## 9. Terraform

- Directorio raíz: infra/.
- Módulos network, database y app.
- Backend local.
- Workspaces dev y prod; no desplegar en default.
- Archivo tfvars correspondiente al workspace.
- Validación bloqueante de coincidencia workspace/entorno.
- Prefijo: iac-panel-{entorno}.
- Un operador de infraestructura a la vez.
- No compartir ni versionar estados.

network:
- Entrada: entorno/prefijo.
- Salida: identificadores de ambas redes.

database:
- Entrada: red backend y configuración.
- Crea contenedor, volumen y credenciales.
- Salida: host y referencias necesarias.
- Salidas sensibles no se imprimen como información de la app.

app:
- Entrada: redes, imágenes y conexión BD.
- Crea API y NGINX.
- Salida: URL pública local.

Usar referencias para dependencias implícitas.
depends_on solo cuando no exista una referencia que exprese la dependencia.
No introducir metaargumentos sin necesidad funcional.

## 10. Límites

- No alta disponibilidad.
- No TLS en el acceso HTTP local del laboratorio.
- No autenticación de aplicación.
- Sin aislamiento fuerte entre operadores del mismo host.
- Las comprobaciones muestran disponibilidad puntual, no monitoreo histórico.
- El estado Terraform puede contener secretos y requiere protección.

### Etapa inicial del frontend: backend no implementado

Durante la inicialización del frontend:
- NGINX sirve únicamente la aplicación Angular.
- No se configura un upstream hacia un backend inexistente.
- Las solicitudes a /api y /api/* devuelven HTTP 404 y JSON:

{
  "error": {
    "code": "API_NOT_CONFIGURED",
    "message": "La API aún no está configurada."
  }
}

- Estas rutas nunca utilizan el fallback HTML de Angular.
- El frontend no presenta esta respuesta como una integración funcional.
- No se activan datos simulados automáticamente.

Cuando se integre Express:
- Se reemplaza esta respuesta temporal por el reverse proxy aprobado.
- Se mantiene el contrato API documentado.
- Se actualizan las instrucciones de ejecución y las pruebas afectadas.