# Backend — API del Panel de verificación IaC

API de las Tareas 1, 2 y 3: Express 5, TypeScript estricto, módulos ES,
configuración validada, `GET /api/info`, `GET /api/health` con consulta real a
PostgreSQL, operaciones de Registros, pool de conexiones y migraciones SQL
versionadas.

## Estado implementado

- `GET /api/info` con `environment`, `apiVersion`, `appVersion` e `instanceId`.
- `GET /api/health` con `SELECT 1` real y contrato 200/503.
- `GET /api/records`, `POST /api/records` y `DELETE /api/records/:id`.
- `instanceId` desde el hostname del contenedor.
- Rutas desconocidas con 404 JSON `NOT_FOUND`.
- Límite JSON de 16 KiB.
- JSON malformado: 400 `VALIDATION_ERROR`.
- Cuerpo demasiado grande: 413 `PAYLOAD_TOO_LARGE`.
- Errores internos: 500 `INTERNAL_ERROR` sin detalles internos.
- Errores de BD no disponible: 503 `DATABASE_UNAVAILABLE`.
- Registro inexistente: 404 `RECORD_NOT_FOUND`.
- Pool PostgreSQL con cierre ordenado ante SIGTERM.
- Configuración `DB_*` obligatoria.
- Migración SQL inicial de `records` y script administrativo de privilegios.
- Sin integración frontend, NGINX, Dockerfiles ni Terraform.

## Registros

- `GET /api/records`: 200 con `{ items, total }`, orden `created_at DESC,
  id DESC`, sin paginación ni filtros. `total` se obtiene con
  `count(*) OVER()` en la misma consulta que los elementos.
- `POST /api/records`: 201 con el registro insertado. `title` obligatorio
  (1–100 caracteres); `description` opcional (máximo 500) y normalizada a
  `null` si se omite, es `null` o queda vacía tras el recorte.
- `DELETE /api/records/:id`: 204 sin cuerpo; 400 para UUID inválido; 404
  `RECORD_NOT_FOUND` si no existe. Usa el resultado real del `DELETE`.
- Se rechazan campos desconocidos, incluidos `id` y `createdAt` enviados por el
  cliente. El identificador lo genera el servidor con `randomUUID()`.
- Las longitudes se cuentan en puntos de código Unicode (`Array.from`), igual
  que `char_length` y `VARCHAR(n)` de PostgreSQL. Se rechazan caracteres NUL,
  que PostgreSQL no puede almacenar en `text`.
- Todas las consultas usan SQL parametrizado. No se añadió ORM ni dependencias
  de runtime nuevas.
- Mapeo de errores: los fallos de conexión, timeout de adquisición del pool y
  SQLSTATE de disponibilidad se convierten en 503 `DATABASE_UNAVAILABLE`. Las
  restricciones, permisos y errores de programación se mantienen como 500
  `INTERNAL_ERROR`; no se convierten todos los errores SQL en 503.

## Configuración

Variables requeridas:
- `APP_ENV`: `dev` o `prod`.
- `APP_VERSION`: versión del backend.
- `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`: credenciales de aplicación.

Variables opcionales:
- `PORT`: 3000 por defecto.
- `DB_PORT`: 5432 por defecto.

Solo para la migración administrativa:
- `MIGRATION_DATABASE_URL`: URL con credenciales administrativas. La API en
  ejecución no la recibe.

Ejemplo sin secretos: `.env.example`.

La conectividad con PostgreSQL no es requisito para arrancar. Con
configuración válida y la base inaccesible, `/api/info` responde 200 y
`/api/health` responde 503.

## Dependencias: runtime y migración

- Runtime: `express` y `pg` (dependencias de producción).
- Desarrollo y migración: `@types/pg` y `node-pg-migrate`.
- El runtime de la API no requiere `node-pg-migrate`.
- La migración se ejecuta como operación administrativa separada, nunca desde
  el arranque de la API ni desde una solicitud HTTP.
- `node-pg-migrate@9.0.0` incorpora `glob@13.0.7` y `minimatch@10.2.6`, con las
  alertas moderadas registradas en `BITACORA.md`.

## Comandos endurecidos

Ejecutar desde `app/backend/`. Imagen y límites del perfil validado para el
backend.

Instalación reproducible (incluye dependencias de migración):

```bash
docker run --rm \
  --user "$(id -u):$(id -g)" \
  --cap-drop=ALL \
  --security-opt=no-new-privileges:true \
  --pids-limit=512 \
  --cpus=2 --memory=2g --memory-swap=2g \
  --read-only \
  --tmpfs /tmp:rw,nosuid,nodev,size=1g,mode=1777 \
  -e HOME=/tmp/ng-home -e npm_config_cache=/tmp/npm-cache \
  -v "$PWD:/app:rw" -w /app \
  node:24.13.1-bookworm-slim@sha256:a81a03dd965b4052269a57fac857004022b522a4bf06e7a739e25e18bce45af2 \
  sh -lc 'mkdir -p "$HOME" "$npm_config_cache" && npm ci'
```

Compilación:

```bash
docker run --rm \
  --user "$(id -u):$(id -g)" \
  --cap-drop=ALL \
  --security-opt=no-new-privileges:true \
  --pids-limit=512 \
  --cpus=4 --memory=4g --memory-swap=4g \
  --read-only \
  --tmpfs /tmp:rw,nosuid,nodev,size=1g,mode=1777 \
  -e HOME=/tmp/ng-home -e npm_config_cache=/tmp/npm-cache \
  -v "$PWD:/app:rw" -w /app \
  node:24.13.1-bookworm-slim@sha256:a81a03dd965b4052269a57fac857004022b522a4bf06e7a739e25e18bce45af2 \
  sh -lc 'mkdir -p "$HOME" "$npm_config_cache" && npm run build'
```

Verificación de tipos y pruebas:

```bash
docker run --rm \
  --user "$(id -u):$(id -g)" \
  --cap-drop=ALL \
  --security-opt=no-new-privileges:true \
  --pids-limit=512 \
  --cpus=2 --memory=2g --memory-swap=2g \
  --read-only \
  --tmpfs /tmp:rw,nosuid,nodev,size=1g,mode=1777 \
  -e HOME=/tmp/ng-home -e npm_config_cache=/tmp/npm-cache -e CI=true \
  -v "$PWD:/app:rw" -w /app \
  node:24.13.1-bookworm-slim@sha256:a81a03dd965b4052269a57fac857004022b522a4bf06e7a739e25e18bce45af2 \
  sh -lc 'mkdir -p "$HOME" "$npm_config_cache" && npm run typecheck && npm test'
```

## Migraciones

El comando usa las dependencias de desarrollo/migración y las migraciones SQL
del repositorio. Desde `app/backend`, con el repositorio montado en
`/workspace` para resolver `../database/migrations`:

```bash
docker run --rm \
  --network "$NET" \
  --user "$(id -u):$(id -g)" \
  --cap-drop=ALL \
  --security-opt=no-new-privileges:true \
  --pids-limit=512 \
  --cpus=2 --memory=2g --memory-swap=2g \
  --read-only \
  --tmpfs /tmp:rw,nosuid,nodev,size=1g,mode=1777 \
  -e HOME=/tmp/ng-home -e npm_config_cache=/tmp/npm-cache \
  --env-file "$TMP/migration.env" \
  -v "$REPO:/workspace:ro" -w /workspace/app/backend \
  node:24.13.1-bookworm-slim@sha256:a81a03dd965b4052269a57fac857004022b522a4bf06e7a739e25e18bce45af2 \
  sh -lc 'npm run db:migrate'
```

- `MIGRATION_DATABASE_URL` debe apuntar al administrador.
- La tabla de historial es `pgmigrations`.
- Reejecutar sin pendientes responde `No migrations to run!`.
- El script de privilegios se ejecuta después de migrar, como administrador, y
  es idempotente:

```bash
docker exec -i -e PGPASSWORD="$ADMIN_PASSWORD" "$PG" \
  psql -U "$ADMIN_USER" -d "$DB_NAME" \
  -v ON_ERROR_STOP=1 -v database_name="$DB_NAME" -v app_user="$APP_USER" \
  < app/database/scripts/grant-app-privileges.sql
```

El rol de aplicación debe existir antes de aplicar los grants. Su creación
corresponde a la inicialización del entorno (Terraform en la etapa de
infraestructura) o a un paso administrativo equivalente en pruebas.

## Comprobación con PostgreSQL temporal

Las validaciones de Tareas 2 y 3 usaron una red y un volumen dedicados, sin
publicar PostgreSQL ni la API al host. PostgreSQL se ejecutó con la imagen
`postgres:17.11-bookworm@sha256:665dc7b37ac52a17e298511414c21d23ffa4e6a6ef6225b3e5d59c7afb35e994`,
sin forzar uid, sin `--read-only` y sin `--cap-drop`; el proceso efectivo es
`postgres` (uid 999). Límites comprobados: 1 CPU, 1 GiB, MemorySwap 1 GiB y
256 PIDs.

La API se ejecutó en la misma red con `--network-alias api`, sin puertos
publicados y con el perfil endurecido de Node. Resultados verificados:

- `/api/health` con BD disponible: 200, `database: "up"`.
- `/api/health` con BD detenida: 503, `database: "down"`.
- `/api/info` con BD detenida: 200.
- Registros por HTTP: listado vacío 200, creación 201, listado 200, eliminación
  204 sin cuerpo, segunda eliminación 404 `RECORD_NOT_FOUND`, UUID inválido
  400 `VALIDATION_ERROR`, `id` enviado por el cliente 400 y título de 101
  caracteres 400.
- `/api/records` con BD detenida: 503 `DATABASE_UNAVAILABLE` entre 1008 y
  1084 ms. Recuperación tras reiniciar PostgreSQL: primera consulta 503 y
  siguientes 200 (48 ms y 6 ms) sobre el mismo proceso.
- Quince fallos consecutivos de health y recuperación posterior sin agotar el
  pool.
- Cierre ante SIGTERM con exit 0.

## Pruebas y auditoría

- `npm ci`: exit 0.
- `npm run build`: exit 0.
- `npm run typecheck`: exit 0.
- `npm test`: 11 archivos; 116 pruebas unitarias aprobadas y 14 de integración
  omitidas por defecto.
- Con PostgreSQL real descartable, guard destructivo y `RUN_DB_INTEGRATION=1`:
  11 archivos y 130 pruebas aprobadas (116 unitarias y 14 de integración).
- `npm audit`: exit 1 por 3 vulnerabilidades moderadas de desarrollo
  (`node-pg-migrate`, `glob`, `minimatch`).
- `npm audit --omit=dev`: exit 0, 0 vulnerabilidades en el alcance auditado.
  No corrige las CVE ni sustituye la auditoría completa.
- El despliegue real con PostgreSQL se validó en red Docker dedicada; el
  detalle está en `docs/pruebas.md`.

### Pruebas de integración

La suite `tests/records.integration.spec.ts` se ejecuta solo con
`RUN_DB_INTEGRATION=1` y las variables `DB_*` de una base descartable. Además
exige el guard destructivo:

```bash
RUN_DB_INTEGRATION=1 \
DESTRUCTIVE_DB_TESTS=1 \
DB_NAME=iac_test_frontend \
TEST_DB_CONFIRM=iac_test_frontend \
TEST_DB_MARKER_TOKEN="$TEST_DB_MARKER_TOKEN" \
npm test
```

- `DB_NAME` debe empezar por `iac_test_`.
- `TEST_DB_CONFIRM` debe coincidir exactamente con `DB_NAME`.
- El setup administrativo descartable crea `test_guard.marker` con un token
  aleatorio; la aplicación solo recibe `SELECT` sobre ese marcador.
- El guard se ejecuta antes de cada `DELETE FROM records`.
- Si falla una condición, la suite falla antes de limpiar y no se omite.
- Requiere el rol de aplicación con `SELECT`, `INSERT` y `DELETE`.
- No usar sobre una base con datos que deban conservarse.
- No necesita credenciales administrativas.
- Las pruebas negativas del guard están en
  `tests/destructive-db-guard.spec.ts`.

## Imágenes de contenedor

- `app/backend/Dockerfile` contiene los targets `build`, `prod-deps`, `runtime`
  y `migration`.
- Runtime: `node:24.13.1-bookworm-slim`, usuario `node`, `SIGTERM` y
  `CMD ["node","dist/server.js"]`.
- `npm ci --omit=dev`; solo `express` y `pg` en runtime. `node-pg-migrate`,
  TypeScript, Vitest y Supertest quedan fuera.
- Migración: target separado con `node-pg-migrate` y
  `app/database/migrations`.
- Construcción desde la raíz del repositorio:

```bash
docker build --platform linux/amd64 -f app/backend/Dockerfile --target runtime -t iac-panel-api:0.1.0 .
docker build --platform linux/amd64 -f app/backend/Dockerfile --target migration -t iac-panel-api-migrate:0.1.0 .
```

- Evidencias: `docs/Evidencias/IMP-010/`.

## Pendientes

- Pruebas de integración del sistema completo (frontend + API + PostgreSQL).
- Integración de roles y migraciones con Terraform.
- NGINX, Dockerfiles y despliegue final.
