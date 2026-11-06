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

Los comandos siguientes usan el perfil endurecido validado en IMP-005:
usuario no root, `--cap-drop=ALL`, `no-new-privileges`, límites por
contenedor, raíz de solo lectura y `/tmp` en tmpfs. El montaje
`app/frontend` permanece `rw` porque npm y Angular necesitan escribir.
Límites: instalación, pruebas y servidor usan 2 CPU y 2 GiB; compilación usa
4 CPU y 4 GiB; 512 PIDs; swap igual a memoria. En esta validación `/tmp`
quedó con `noexec` por Docker; no se asume como comportamiento universal.
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
  --cpus=2 --memory=2g --memory-swap=2g \
  --read-only \
  --tmpfs /tmp:rw,nosuid,nodev,size=1g,mode=1777 \
  -e HOME=/tmp/ng-home -e npm_config_cache=/tmp/npm-cache \
  -e CI=true \
  -v "$PWD/app/frontend:/app:rw" -w /app \
  node:24.13.1-bookworm-slim@sha256:a81a03dd965b4052269a57fac857004022b522a4bf06e7a739e25e18bce45af2 \
  sh -lc 'mkdir -p "$HOME" "$npm_config_cache" && npm test -- --watch=false'
```

Resultado verificado: 5 archivos de pruebas y 9 pruebas aprobadas.

### Servidor de desarrollo

Escucha en `0.0.0.0:4200` dentro del contenedor y se publica únicamente en
`127.0.0.1:4200` (verificado con el perfil endurecido):

```bash
docker run --rm --init \
  --user "$(id -u):$(id -g)" \
  --cap-drop=ALL \
  --security-opt=no-new-privileges:true \
  --pids-limit=512 \
  --cpus=2 --memory=2g --memory-swap=2g \
  --read-only \
  --tmpfs /tmp:rw,nosuid,nodev,size=1g,mode=1777 \
  -e HOME=/tmp/ng-home -e npm_config_cache=/tmp/npm-cache \
  -p 127.0.0.1:4200:4200 \
  -v "$PWD/app/frontend:/app:rw" -w /app \
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

## Estructura

- `app/frontend/`: aplicación Angular.
- `docs/`: requerimientos, arquitectura, despliegue y pruebas.
- `infra/`: Terraform (pendiente).

## Documentación

- [Requerimientos](docs/requerimientos.md)
- [Arquitectura](docs/arquitectura.md)
- [Despliegue](docs/despliegue.md)
- [Pruebas](docs/pruebas.md)
