# Evidencias — Dockerfiles e imágenes (IMP-010)

Fecha: 2026-11-07.

## Bases verificadas

- Node: `node:24.13.1-bookworm-slim@sha256:a81a03dd965b4052269a57fac857004022b522a4bf06e7a739e25e18bce45af2`.
- NGINX: `nginx/nginx-unprivileged:1.30.6-alpine3.24-slim@sha256:016193c18ef1ce19dc2229d3305f69af1b05e0bc0e8fe6ee724a58bd305f3855`.
  - Arquitectura amd64; NGINX 1.30.6; usuario 101; puerto 8080; `SIGQUIT`.
  - PID y temporales en `/tmp` verificados en la imagen.
- PostgreSQL: `postgres:17.11-bookworm@sha256:665dc7b37ac52a17e298511414c21d23ffa4e6a6ef6225b3e5d59c7afb35e994`.

## Imágenes construidas

- `iac-panel-web:0.1.0` — ID `sha256:45994eab833cd14f26f910a78bb35e72a204127e0537d780f02c1e64467e851c` — 22.2 MB.
- `iac-panel-api:0.1.0` — ID `sha256:33d2f1d57344599d2303393b440598257085b667e3b8bdc78e6b0550a12ae7a3` — 325 MB.
- `iac-panel-api-migrate:0.1.0` — ID `sha256:2dcea5fc7c988d9f9f7a816016b6ec70469f8ea8d5347e382dfe3d8f25d1f589` — 553 MB.

Targets construidos: `runtime` del frontend, `runtime` del backend y `migration` del backend.

## Etapa A — Frontend/NGINX

- Usuario efectivo: uid 101 (`nginx`).
- Sin Node, npm, `src` ni `node_modules` en la imagen final.
- Puerto interno 8080; `SIGQUIT`.
- `nginx -t`: correcto.
- `nginx -T`: incluye `/etc/nginx/api-proxy.conf`.
- Arranque con `--read-only` y tmpfs `/tmp`: correcto.
- `/`, `/estado`, `/registros` y ruta desconocida: 200, `text/html`, con `app-root`.
- `/api-docs`: 404, no proxificado.
- API ausente al arrancar: `/api/info` y `/api/records` devuelven 502 JSON
  `UPSTREAM_UNAVAILABLE`, con `Cache-Control: no-store`.

## Etapa B — Runtime API

- Usuario efectivo: uid 1000 (`node`).
- Node 24.13.1.
- `pg` 8.23.1 y `express` 5.3.0 presentes.
- `node-pg-migrate`, `typescript` y `vitest` ausentes del runtime.
- `SIGTERM`.
- Arranque con `--read-only` y tmpfs `/tmp`: correcto.
- `/api/info`, `/api/health` y `/api/records` responden contra PostgreSQL real.

## Etapa C — Migración y grants

- Imagen de migración con `node-pg-migrate`.
- Binario real verificado: `node_modules/node-pg-migrate/bin/node-pg-migrate.js`.
- Migraciones incluidas: `1794009600000_create-records.sql`.
- Primera migración: aplicada.
- Segunda migración: `No migrations to run!`.
- `pgmigrations`: una fila.
- Grants ejecutados con `psql` desde la imagen oficial de PostgreSQL.
- Privilegios efectivos del rol de aplicación:
  - `SELECT`, `INSERT`, `DELETE`: permitidos.
  - `UPDATE`, `TRUNCATE`, `CREATE` en `public`: denegados.
- Incidencia de entorno: la primera conexión se hizo antes de que el init de
  PostgreSQL creara la base; se repitió tras esperar `SELECT 1` y todas las
  operaciones pasaron.

## Etapa D — Integración

- Solo NGINX publicó en `127.0.0.1:18080`; API y PostgreSQL sin puertos.
- Red backend interna; API en frontend y backend; PostgreSQL solo en backend.
- `/api/info`, `/api/health` y `/api/records`: 200, JSON,
  `Cache-Control: no-store`.
- `/api-docs`: 404.
- Query string y prefijo: un servidor de eco recibió
  `/api/probe?x=1&y=2`; se conservaron prefijo y parámetros.
- API recreada con nueva IP: `instanceId` cambió de `91e5b3cdc6fb` a
  `ebecd1d10137`; `/api/info` volvió a 200 sin reiniciar NGINX.
- API detenida: `/api/info` 502 JSON `UPSTREAM_UNAVAILABLE`, no-store;
  recuperación a 200.
- Error del backend conservado: `POST /api/records` con `{}` devolvió 400 JSON
  `VALIDATION_ERROR`, no-store.
- 17 KiB: Express devolvió 413 JSON `PAYLOAD_TOO_LARGE`, no-store.
- 1.1 MiB: NGINX devolvió 413 JSON `PAYLOAD_TOO_LARGE`, no-store.
- PostgreSQL detenido con API viva:
  - `/api/health`: 503 con `database=down`, no-store.
  - `/api/records`: 503 `DATABASE_UNAVAILABLE`, no-store.
  - Recuperación a 200.
- Persistencia: se creó el registro `ab889517-9c5b-4918-9289-5f9a5167a7a7`;
  se eliminó y recreó PostgreSQL con el mismo volumen y el registro siguió
  presente.
- Cierre: NGINX exit 0 con `SIGQUIT`; API exit 0 con `SIGTERM` y log
  `shutdown complete`; PostgreSQL exit 0.
- Puerto 18080 liberado.

## Limitaciones

- No se realizó una validación visual de la aplicación servida por la nueva
  imagen NGINX. La evidencia de navegador de IMP-009 corresponde a la etapa
  anterior y no se reutiliza como validación de esta imagen.
- No se probó TLS, dominio público, CORS ni exposición externa.
- Terraform y Compose no se implementaron.
- El aviso de presupuesto Angular de 528.53 kB se mantiene sin cambios.

## Limpieza

- Contenedores de prueba, redes, volumen y credenciales temporales eliminados.
- No se eliminaron imágenes ni cachés globales.
- Se conservan `iac-panel-web:0.1.0`, `iac-panel-api:0.1.0` y
  `iac-panel-api-migrate:0.1.0`.
