# Panel de verificación IaC

La meta del proyecto es una plataforma web local completa de tres capas
(Angular, API Express y PostgreSQL), con NGINX como servidor web y reverse
proxy, desplegada con Terraform y Docker. Esa plataforma completa sigue
siendo el objetivo pendiente; el frontend ya está integrado con la API y
PostgreSQL, y faltan NGINX, Dockerfiles y Terraform.
El alcance, la arquitectura y el despliegue detallados están en `docs/`.

## Estado actual

- Frontend Angular 21 inicializado en `app/frontend/` y compilable.
- Base creada con componentes standalone, routing, SCSS, TypeScript estricto,
  modo zoneless y sin SSR.
- Primera estructura visual con Material/CDK 21.2.14: navegación «Estado» y
  «Registros», rutas `/estado` y `/registros`, redirección desde `/`, página
  404, logo local y diseño adaptable.
- Estado y Registros consumen la API real: `/api/info`, `/api/health` y
  `/api/records`. El frontend no usa datos simulados ni activa simulación ante
  fallos.
- Desarrollo con proxy `/api/**` hacia el alias `api`; rutas relativas y
  versión de interfaz generada desde `package.json`.
- Estructura visual y navegación base: validadas manualmente por el usuario el
  2026-11-05. Esa validación no cubre la integración nueva, NGINX, Terraform ni
  el despliegue final.
- Integración validada con Playwright 1.65.0 y Chromium 158 headless:
  navegación, formularios, diálogo, teclado, foco, responsive y consola. Las
  evidencias están en `docs/Evidencias/IMP-009/`.
- Backend con `/api/info`, `/api/health` y `/api/records`, pool PostgreSQL,
  configuración `DB_*` y migraciones versionadas implementados y validados con
  PostgreSQL 17 real. Dockerfiles, imágenes y NGINX implementados y
  verificados; Terraform pendiente.
- `/api/info` sigue disponible y `/api/health` responde 503 cuando PostgreSQL
  no está accesible.
- La imagen NGINX final proxifica `/api` y `/api/` hacia `api:3000`. El modo
  sin backend con 404 JSON `API_NOT_CONFIGURED` queda como decisión documental
  separada; si la API configurada falla, NGINX devuelve 502/504 JSON.

## Deuda de seguridad pendiente

`npm audit` del frontend mantiene 16 alertas moderadas en dependencias de
desarrollo (`glob` y `minimatch`) que llegan por Angular CLI 21. No están
corregidas y no se silencian. El detalle, la cadena afectada y las condiciones
de revisión están en `BITACORA.md` (IMP-003).

El backend incorpora 3 alertas moderadas en dependencias de
desarrollo/migración (`node-pg-migrate`, `glob` y `minimatch`), registradas
por separado. El runtime de la API no requiere `node-pg-migrate`.
`npm audit --omit=dev` da 0 en el alcance auditado; eso no corrige las CVE ni
sustituye la auditoría completa.

## Prerrequisitos

- Docker Engine o Docker Desktop operativo y acceso autorizado al daemon.
- Soporte de cgroups v2 para aplicar límites de CPU, memoria y PIDs.
- Bash y utilidades de un entorno Linux o equivalente.
- Acceso a internet para descargar la imagen y las dependencias
  cuando no estén disponibles localmente.
- No se requiere Node.js, npm ni Angular CLI instalados en el host.
- Puerto TCP 4200 libre en `127.0.0.1` para el servidor de desarrollo.
- `app/frontend/node_modules/` instalado; si falta, ejecutar primero la
  instalación reproducible con `npm ci`.

## Frontend dentro de contenedores

Versiones usadas y verificadas:

- Node.js 24.13.1 mediante la imagen `node:24.13.1-bookworm-slim`
  (digest `sha256:a81a03dd965b4052269a57fac857004022b522a4bf06e7a739e25e18bce45af2`).
- Angular CLI 21.2.29 y `@angular/build` 21.2.29.
- Angular 21.2.26, Angular Material 21.2.14, Angular CDK 21.2.14 y
  TypeScript 5.9.3 resueltos por `app/frontend/package-lock.json`.

Ejecutar desde la raíz del repositorio.

La versión de interfaz se genera de forma determinista desde
`app/frontend/package.json` con `npm run generate:version`; los hooks
`prestart`, `prebuild` y `pretest` la regeneran. El archivo generado está
ignorado por Git. El proxy de desarrollo está en `app/frontend/proxy.conf.json`
y se aplica por defecto desde `angular.json`: `/api/**` se reenvía a
`http://api:3000` conservando el prefijo; `/api-docs` no se reenvía.

Los comandos siguientes usan el perfil endurecido validado en IMP-005:
usuario no root, `--cap-drop=ALL`, `no-new-privileges`, límites por
contenedor, raíz de solo lectura y `/tmp` en tmpfs. El montaje
`app/frontend` permanece `rw` porque npm y Angular necesitan escribir.
Límites: instalación usa 2 CPU y 2 GiB. Pruebas y servidor de desarrollo usan
4 CPU y 4 GiB porque Angular compila; con 2 GiB `ng test` fue terminado
(exit 137). Compilación usa 4 CPU y 4 GiB; 512 PIDs; swap igual a memoria. En
esta validación `/tmp` quedó con `noexec` por Docker; no se asume como
comportamiento universal.
Estas medidas son compensatorias: no corrigen las alertas de IMP-003. Docker
sigue en modo rootful y `app/frontend` continúa montado `rw`.

Instalación reproducible:

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
  -v "$PWD/app/frontend:/app:rw" -w /app \
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
  -v "$PWD/app/frontend:/app:rw" -w /app \
  node:24.13.1-bookworm-slim@sha256:a81a03dd965b4052269a57fac857004022b522a4bf06e7a739e25e18bce45af2 \
  sh -lc 'mkdir -p "$HOME" "$npm_config_cache" && npm run build'
```

La salida de compilación queda en
`app/frontend/dist/iac-panel-frontend/browser/`.

### Pruebas unitarias

Ejecución única, sin modo watch (verificada con el perfil endurecido):

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
  -e CI=true \
  -v "$PWD/app/frontend:/app:rw" -w /app \
  node:24.13.1-bookworm-slim@sha256:a81a03dd965b4052269a57fac857004022b522a4bf06e7a739e25e18bce45af2 \
  sh -lc 'mkdir -p "$HOME" "$npm_config_cache" && npm test -- --watch=false'
```

Resultado verificado: 14 archivos y 60 pruebas aprobadas. La compilación de
pruebas requiere el perfil 4 CPU/4 GiB.

### Servidor de desarrollo

Escucha en `0.0.0.0:4200` dentro del contenedor y se publica únicamente en
`127.0.0.1:4200` (verificado con el perfil endurecido):

```bash
docker run --rm --init \
  --user "$(id -u):$(id -g)" \
  --cap-drop=ALL \
  --security-opt=no-new-privileges:true \
  --pids-limit=512 \
  --cpus=4 --memory=4g --memory-swap=4g \
  --read-only \
  --tmpfs /tmp:rw,nosuid,nodev,size=1g,mode=1777 \
  -e HOME=/tmp/ng-home -e npm_config_cache=/tmp/npm-cache \
  -p 127.0.0.1:4200:4200 \
  -v "$PWD/app/frontend:/app:rw" -w /app \
  node:24.13.1-bookworm-slim@sha256:a81a03dd965b4052269a57fac857004022b522a4bf06e7a739e25e18bce45af2 \
  sh -lc 'mkdir -p "$HOME" "$npm_config_cache" && npm start -- --host 0.0.0.0 --port 4200'
```

Acceso local: `http://127.0.0.1:4200/`. Para detenerlo, usar `Ctrl+C`.

### Entorno integrado de desarrollo

- Red frontend no interna: Angular y API; alias `api`.
- Red backend interna: API y PostgreSQL; alias `postgres`.
- API en ambas redes; PostgreSQL solo en la backend.
- Solo Angular publica `127.0.0.1:4200`. API y PostgreSQL no publican puertos.
- Comando de proxy: `npm start -- --host 0.0.0.0 --port 4200`.
- Las instrucciones completas con nombres únicos y variables están en
  [app/frontend/README.md](app/frontend/README.md).

Resultado verificado: el contenedor escuchó en `0.0.0.0:4200`, el host publicó
solo `127.0.0.1:4200` y la respuesta HTTP fue 200.

Comprobación HTTP: `/`, `/estado`, `/registros` y una ruta desconocida
respondieron 200 con el HTML de la aplicación; `/logo.svg` respondió 200.
El título y `lang="es"` están presentes. Esto no sustituye una validación de
renderizado en navegador.

La validación del perfil endurecido fue por ejecución de comandos y HTTP; no
se repitió la validación visual en navegador con este perfil. La validación
visual de IMP-004 corresponde a aquella ejecución y no se reutiliza como
prueba de este perfil.

Validación manual del usuario (2026-11-05): se aprobaron el renderizado de
Estado, la redirección `/` → `/estado`, la navegación Estado/Registros, el
acceso directo y la recarga de `/registros`, la página 404, la consola sin
errores de la aplicación observados, la red sin solicitudes a `/api`, la
ausencia de recursos externos de la aplicación, la vista de 360 px, el cambio
entre 959 y 960 px, el menú móvil, la navegación por teclado, el foco visible
y el enlace «Saltar al contenido». No se observaron incidencias y no se
tomaron capturas. Esta comprobación no fue ejecutada ni automatizada por el
agente y no verifica NGINX, Terraform ni el despliegue final.

Siguen pendientes la integración API, las comprobaciones reales de servicios,
los formularios, los listados y la resolución de la deuda de seguridad
registrada en `BITACORA.md`.

## Backend (API)

Base Express 5 + TypeScript en `app/backend/`. Implementa `GET /api/info`,
`GET /api/health` con `SELECT 1` real, `GET/POST/DELETE /api/records`,
respuestas JSON para rutas desconocidas, límite JSON de 16 KiB, errores seguros,
pool de PostgreSQL y cierre ordenado ante SIGTERM.

Registros usa SQL parametrizado, UUID generado por el servidor, validación de
tipos y longitudes en puntos de código Unicode, y el listado obtiene `items` y
`total` en una sola consulta. La integración con la interfaz sigue pendiente.

Variables requeridas: `APP_ENV` (`dev` o `prod`), `APP_VERSION`, `DB_HOST`,
`DB_NAME`, `DB_USER` y `DB_PASSWORD`; `PORT` y `DB_PORT` son opcionales y valen
3000 y 5432. `MIGRATION_DATABASE_URL` se usa solo durante la migración
administrativa; la API no la recibe.

Migraciones SQL en `app/database/migrations/`; el comando es `npm run db:migrate`
desde `app/backend` con las dependencias de migración instaladas. Los
privilegios del rol de aplicación se aplican con
`app/database/scripts/grant-app-privileges.sql`.

Los comandos endurecidos, las pruebas, la migración y la comprobación HTTP en
red Docker dedicada están en [app/backend/README.md](app/backend/README.md).

## Imágenes y NGINX

Imágenes construidas y verificadas:

- `iac-panel-web:0.1.0`, basada en
  `nginx/nginx-unprivileged:1.30.6-alpine3.24-slim@sha256:016193c18ef1ce19dc2229d3305f69af1b05e0bc0e8fe6ee724a58bd305f3855`.
- `iac-panel-api:0.1.0`, con Node 24.13.1 y dependencias de producción.
- `iac-panel-api-migrate:0.1.0`, con `node-pg-migrate` y las migraciones SQL.

```bash
docker build --platform linux/amd64 -f app/frontend/Dockerfile --target runtime -t iac-panel-web:0.1.0 .
docker build --platform linux/amd64 -f app/backend/Dockerfile --target runtime -t iac-panel-api:0.1.0 .
docker build --platform linux/amd64 -f app/backend/Dockerfile --target migration -t iac-panel-api-migrate:0.1.0 .
```

NGINX escucha en 8080, corre como usuario 101 y usa `SIGQUIT`. El proxy usa el
alias `api:3000`, resolución dinámica de Docker, conserva el prefijo y la query
string, no cachea API y devuelve JSON para fallos de upstream. Las evidencias
están en `docs/Evidencias/IMP-010/`.

## Estructura

- `app/frontend/`: aplicación Angular.
- `app/backend/`: API Express.
- `app/database/`: migraciones SQL y script administrativo de privilegios.
- `app/nginx/`: configuración de NGINX y proxy de API.
- `docs/`: requerimientos, arquitectura, despliegue y pruebas.
- `infra/`: Terraform (pendiente).

## Documentación

- [Requerimientos](docs/requerimientos.md)
- [Arquitectura](docs/arquitectura.md)
- [Despliegue](docs/despliegue.md)
- [Pruebas](docs/pruebas.md)
