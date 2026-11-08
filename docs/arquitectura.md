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
- NGINX: 8080 interno (imagen `nginx-unprivileged`, usuario 101).
- API: 3000 interno.
- PostgreSQL: 5432 interno.
- dev: 127.0.0.1:8080.
- prod: 127.0.0.1:8081.

Los contenedores se comunican por nombres o alias de red, no por localhost.
NGINX alcanza la API por el alias `api` en frontend_net; la API alcanza
PostgreSQL por el nombre de su contenedor (`iac-panel-{entorno}-postgres`),
que también tiene el alias `postgres` en backend_net.

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

Integración con la API real:
- El cliente usa rutas relativas `/api`; no hay URLs absolutas de localhost ni
  CORS abierto.
- Proxy de desarrollo `/api/**` hacia `http://api:3000`; conserva el prefijo y
  no reenvía `/api-docs`.
- `/api/info` y `/api/health` se consultan de forma independiente. Un fallo de
  una no descarta la respuesta válida de la otra.
- Health 200 válido confirma API y PostgreSQL disponibles. Health 503 con
  cuerpo válido confirma API disponible y PostgreSQL no disponible, y cuenta
  como comprobación actual. Timeout, red, proxy o contrato inválido dejan
  PostgreSQL como desconocido.
- No se muestra éxito ante una respuesta inválida.
- Registros valida los contratos en runtime. En mutaciones, 400/404 son
  fallos confirmados; 5xx, timeout, red o respuesta inválida se presentan como
  resultado no confirmado, sin reintentos automáticos.
- La versión de interfaz se genera de forma determinista desde `package.json`
  durante la compilación y es independiente de `APP_VERSION` del backend.
- Las pruebas unitarias usan respuestas controladas; la aplicación real no
  sustituye datos ni activa simulación ante fallos.

Endurecimiento del entorno de desarrollo:
- Comandos en contenedores con usuario no root, `--cap-drop=ALL`,
  `--security-opt=no-new-privileges:true`, límites por contenedor,
  `--read-only` y `/tmp` en tmpfs.
- Límites iniciales: 2 CPU y 2 GiB para instalación, pruebas y servidor;
  4 CPU y 4 GiB para compilación; 512 PIDs; swap igual a memoria.
- `app/frontend` se monta en modo `rw`; Docker opera en modo rootful.
- Estas medidas son compensatorias y no corrigen las alertas de IMP-003.
- En la validación de IMP-005 `/tmp` quedó con `noexec`; no se asume como
  comportamiento universal de Docker.

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

Timeouts (conceptos distintos):
- Recepción de la solicitud HTTP: límite del servidor para recibir el cuerpo;
  no equivale al tiempo total de procesamiento de la ruta.
- Procesamiento de la ruta: la base inicial no incorpora cancelación compleja.
- Adquisición/conexión al pool de PostgreSQL: 1 segundo
  (`connectionTimeoutMillis`).
- Consulta SQL: 2 segundos en la comprobación de salud (`query_timeout` y
  `statement_timeout`), dentro del máximo de 3 segundos.
- Duración total de `GET /api/health`: 3 segundos como plazo de aplicación.
- Espera del frontend: máximo 8 segundos.
- El cierre ordenado ante SIGTERM tiene una espera acotada.
- `server.requestTimeout` no se usa como límite de procesamiento ni de
  consulta; solo regula la recepción de la solicitud HTTP.

Variables:
- APP_ENV: dev o prod.
- APP_VERSION: etiqueta de la versión.
- PORT: 3000.
- DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD: credenciales de aplicación,
  obligatorias desde la Tarea 2.
- MIGRATION_DATABASE_URL: credenciales administrativas usadas únicamente por
  el comando de migración; la API en ejecución no la recibe.

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
  "appVersion": "0.1.0",
  "instanceId": "hostname-del-contenedor"
}

- `apiVersion` identifica la versión del contrato.
- `appVersion` identifica la versión del backend y procede de `APP_VERSION`.
- No depende de una consulta a PostgreSQL.
- No representa la versión de la interfaz.

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

Decisiones de contrato para Registros:
- Orden por `created_at DESC` y desempate por `id DESC`.
- Fechas UTC serializadas con `toISOString()`.
- Identificadores generados por el servidor con `randomUUID()`.
- Los parámetros de ruta aceptan UUID canónicos; no se restringen a UUID v4.
  Se aceptan mayúsculas y minúsculas y se normaliza a minúsculas para consultar.
- Recorte externo con `trim()` de JavaScript antes de validar y almacenar.
- Las longitudes se cuentan en puntos de código Unicode (`Array.from`), lo que
  coincide con `char_length` y `VARCHAR(n)` de PostgreSQL. No se usan unidades
  UTF-16 de JavaScript.
- Se rechazan caracteres NUL, que PostgreSQL no puede almacenar en `text`.
- El listado obtiene `items` y `total` en una sola consulta con
  `count(*) OVER()`, sin una consulta separada de conteo.

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
- NOT_FOUND: 404 para rutas de API desconocidas.
- RECORD_NOT_FOUND: 404.
- PAYLOAD_TOO_LARGE: 413 cuando el cuerpo JSON supera 16 KiB.
- DATABASE_UNAVAILABLE: 503.
- INTERNAL_ERROR: 500.
- UPSTREAM_UNAVAILABLE: 502 generado por NGINX cuando la API configurada no
  está disponible.
- UPSTREAM_TIMEOUT: 504 generado por NGINX cuando la API configurada no
  responde.
- PAYLOAD_TOO_LARGE: 413 también puede generarlo NGINX si se supera el límite
  de transporte; mantiene el mismo sobre JSON.

Un JSON malformado se responde como 400 `VALIDATION_ERROR` con un mensaje
seguro. No se exponen stack traces ni detalles internos.

Las rutas /api desconocidas devuelven 404 JSON.

NGINX no devuelve `API_NOT_CONFIGURED` cuando la API está configurada pero
caída: devuelve 502/504 JSON de upstream. El modo sin backend es una
configuración separada.

Mapeo de errores de base de datos:
- 503 `DATABASE_UNAVAILABLE`: códigos de conexión de Node (`ECONNREFUSED`,
  `ECONNRESET`, `ETIMEDOUT`, `ENOTFOUND`, `EHOSTUNREACH`, `EAI_AGAIN`,
  `EPIPE`), timeout de adquisición del pool, SQLSTATE de clase `08`, `57P01`,
  `57P02`, `57P03`, `53300` y `53400`.
- 500 `INTERNAL_ERROR`: restricciones (`23502`, `23514`, `22001`), permisos
  (`42501`), errores de programación o esquema (`42601`, `42P01`, `22P02`) y
  cualquier error no clasificado.
- No se convierte cualquier error SQL en `DATABASE_UNAVAILABLE`.

## 8. Migraciones y credenciales

- node-pg-migrate; versiones exactas bloqueadas con npm.
- Migraciones SQL versionadas en app/database/migrations/.
- `node-pg-migrate` es una dependencia de desarrollo/migración: el runtime de
  la API no la necesita. La migración se ejecuta como operación administrativa
  separada, no durante el arranque de la API ni desde solicitudes HTTP.
- Ejecutar npm run db:migrate mediante un paso explícito de despliegue.
- Reejecutar sin migraciones pendientes no modifica datos.
- No borrar datos ni revertir automáticamente.
- Los privilegios se aplican con un script administrativo idempotente separado
  (`app/database/scripts/grant-app-privileges.sql`).

Credenciales:
- Administrador para inicialización y migración.
- Usuario de aplicación separado, sin superusuario ni permisos DDL.
- Usuario de aplicación con permisos de conexión y `SELECT`, `INSERT` y
  `DELETE` sobre records. Sin `UPDATE`, `CREATE`, `ALTER`, `DROP` ni
  `TRUNCATE`.
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

Implementación (IMP-011, verificada el 2026-11-08):
- Guarda de workspace: `terraform_data.workspace_guard` con una precondición
  `terraform.workspace == var.environment`; bloquea `default` y combinaciones
  cruzadas.
- La dependencia API -> PostgreSQL se expresa con `DB_HOST` = nombre del
  contenedor de PostgreSQL (referencia), sin `depends_on`.
- `lifecycle.ignore_changes = [ipv6]` en las redes, porque IPv6 depende del
  daemon (Docker Desktop lo activa por defecto) y el provider no puede
  forzarlo a `false`. Es el único metaargumento añadido.
- `memory_swap` igual a `memory` en todos los contenedores para evitar deriva
  y swap.
- El rol de aplicación lo crea un script de `/docker-entrypoint-initdb.d/` y
  `deploy.sh` lo reconcilia de forma idempotente.
- Detalle operativo en [despliegue.md](despliegue.md).

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

La imagen final implementada ya usa el proxy `/api` y `/api/` hacia
`api:3000`, con resolución dinámica por el DNS de Docker. El modo sin backend
se conserva como configuración documental separada y no se mezcla con el modo
con backend configurado.