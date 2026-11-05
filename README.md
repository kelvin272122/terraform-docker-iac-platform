# Panel de verificación IaC

La meta del proyecto es una plataforma web local completa de tres capas
(Angular, API Express y PostgreSQL), con NGINX como servidor web y reverse
proxy, desplegada con Terraform y Docker. Esa plataforma completa sigue
siendo el objetivo pendiente; por ahora existe la base del frontend y su
primera estructura visual.
El alcance, la arquitectura y el despliegue detallados están en `docs/`.

## Estado actual

- Frontend Angular 21 inicializado en `app/frontend/` y compilable.
- Base creada con componentes standalone, routing, SCSS, TypeScript estricto,
  modo zoneless y sin SSR.
- Primera estructura visual con Material/CDK 21.2.14: navegación «Estado» y
  «Registros», rutas `/estado` y `/registros`, redirección desde `/`, página
  404, logo local y diseño adaptable.
- Estado y Registros muestran solo estructuras y mensajes neutrales; no hay
  llamadas a `/api` ni métricas ficticias.
- Estructura visual y navegación: implementadas y validadas manualmente por el
  usuario el 2026-11-05. La validación no fue automatizada ni ejecutada por el
  agente y no cubre NGINX, Terraform ni el despliegue final.
- Integración API, comprobaciones reales de servicios, dashboard funcional,
  formularios y listados: pendientes.
- Backend, base de datos, Dockerfiles, NGINX y Terraform: pendientes.
- La respuesta temporal de `/api` para la etapa sin backend queda pendiente
  de definir para NGINX (contradicción registrada en `BITACORA.md`).

## Deuda de seguridad pendiente

`npm audit` mantiene 16 alertas moderadas en dependencias de desarrollo
(`glob` y `minimatch`) que llegan por Angular CLI 21. No están corregidas y
no se silencian. El detalle, la cadena afectada y las condiciones de revisión
están en `BITACORA.md` (IMP-003).

## Prerrequisitos

- Docker Engine o Docker Desktop operativo y acceso autorizado al daemon.
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

Instalación reproducible:

```bash
docker run --rm --user "$(id -u):$(id -g)" \
  -e HOME=/tmp/ng-home -e npm_config_cache=/tmp/npm-cache \
  -v "$PWD/app/frontend:/app" -w /app \
  node:24.13.1-bookworm-slim@sha256:a81a03dd965b4052269a57fac857004022b522a4bf06e7a739e25e18bce45af2 \
  sh -lc 'mkdir -p "$HOME" "$npm_config_cache" && npm ci'
```

Compilación:

```bash
docker run --rm --user "$(id -u):$(id -g)" \
  -e HOME=/tmp/ng-home -e npm_config_cache=/tmp/npm-cache \
  -v "$PWD/app/frontend:/app" -w /app \
  node:24.13.1-bookworm-slim@sha256:a81a03dd965b4052269a57fac857004022b522a4bf06e7a739e25e18bce45af2 \
  sh -lc 'npm run build'
```

La salida de compilación queda en
`app/frontend/dist/iac-panel-frontend/browser/`.

### Pruebas unitarias

Ejecución única, sin modo watch (verificada):

```bash
docker run --rm --user "$(id -u):$(id -g)" \
  -e HOME=/tmp/ng-home -e npm_config_cache=/tmp/npm-cache \
  -e CI=true \
  -v "$PWD/app/frontend:/app" -w /app \
  node:24.13.1-bookworm-slim@sha256:a81a03dd965b4052269a57fac857004022b522a4bf06e7a739e25e18bce45af2 \
  sh -lc 'mkdir -p "$HOME" "$npm_config_cache" && npm test -- --watch=false'
```

Resultado verificado: 5 archivos de pruebas y 9 pruebas aprobadas.

### Servidor de desarrollo

Escucha en `0.0.0.0:4200` dentro del contenedor y se publica únicamente en
`127.0.0.1:4200` (verificado):

```bash
docker run --rm --init --user "$(id -u):$(id -g)" \
  -e HOME=/tmp/ng-home -e npm_config_cache=/tmp/npm-cache \
  -p 127.0.0.1:4200:4200 \
  -v "$PWD/app/frontend:/app" -w /app \
  node:24.13.1-bookworm-slim@sha256:a81a03dd965b4052269a57fac857004022b522a4bf06e7a739e25e18bce45af2 \
  sh -lc 'mkdir -p "$HOME" "$npm_config_cache" && npm start -- --host 0.0.0.0 --port 4200'
```

Acceso local: `http://127.0.0.1:4200/`. Para detenerlo, usar `Ctrl+C`.

Resultado verificado: el contenedor escuchó en `0.0.0.0:4200`, el host publicó
solo `127.0.0.1:4200` y la respuesta HTTP fue 200.

Comprobación HTTP: `/`, `/estado`, `/registros` y una ruta desconocida
respondieron 200 con el HTML de la aplicación; `/logo.svg` respondió 200.
El título y `lang="es"` están presentes. Esto no sustituye una validación de
renderizado en navegador.

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

## Estructura

- `app/frontend/`: aplicación Angular.
- `docs/`: requerimientos, arquitectura, despliegue y pruebas.
- `infra/`: Terraform (pendiente).

## Documentación

- [Requerimientos](docs/requerimientos.md)
- [Arquitectura](docs/arquitectura.md)
- [Despliegue](docs/despliegue.md)
- [Pruebas](docs/pruebas.md)
