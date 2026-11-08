# Despliegue — Panel de verificación IaC

## 1. Estado

Los Dockerfiles, las imágenes, la configuración NGINX, Terraform y los
scripts de despliegue están implementados y verificados (IMP-011, 2026-11-08)
en Windows 11 con Git Bash, Docker Desktop 29.6.2 y Terraform 1.17.0. Los
resultados están en [pruebas.md](pruebas.md) y en `Evidencias/IMP-011/`.

## 2. Prerrequisitos

- Docker Engine o Docker Desktop operativo.
- Docker CLI y acceso autorizado al daemon.
- Terraform CLI para el despliegue de infraestructura.
- Node.js 24, npm y Angular CLI se ejecutan dentro de contenedores
  para inicializar, desarrollar, probar y construir el frontend;
  no se requieren instalados en el host.
- Bash para scripts.
- Git recomendado para identificación de versiones.

Registrar antes de la primera prueba:
- Sistema operativo y arquitectura.
- CPU y RAM del equipo.
- Versiones exactas de Docker, Terraform y Node utilizado en contenedores.
- Versiones de providers.
- Etiquetas y digests de imágenes base.
- Identificador del código utilizado.

No prometer un mínimo de hardware sin medirlo.

## 3. Política de versiones

- npm con package-lock.json y npm ci.
- Backend: pg 8.23.1 como dependencia de runtime; @types/pg 8.23.1 y
  node-pg-migrate 9.0.0 como dependencias de desarrollo/migración.
- .nvmrc como referencia de la versión Node usada en contenedores.
- Restricción de versión Terraform.
- Restricciones de providers y .terraform.lock.hcl versionado.
- Imágenes base fijadas por etiqueta y digest verificado.
- Node: `node:24.13.1-bookworm-slim@sha256:a81a03dd965b4052269a57fac857004022b522a4bf06e7a739e25e18bce45af2`.
- NGINX: `nginx/nginx-unprivileged:1.30.6-alpine3.24-slim@sha256:016193c18ef1ce19dc2229d3305f69af1b05e0bc0e8fe6ee724a58bd305f3855`.
- PostgreSQL: `postgres:17.11-bookworm@sha256:665dc7b37ac52a17e298511414c21d23ffa4e6a6ef6225b3e5d59c7afb35e994`.
- No usar latest.
- No actualizar dependencias durante la defensa.

## 4. Imágenes

Construcción previa a Terraform. Los Dockerfiles y las imágenes están
implementados y verificados; los scripts de infraestructura siguen pendientes.

Frontend:
- Dockerfile: `app/frontend/Dockerfile`.
- Contexto de build: raíz del repositorio.
- `.dockerignore` en la raíz.
- Targets: `build` y `runtime`. La etapa `development` queda pendiente y no se
  añadió en esta tarea.
- `npm ci`, generación de versión mediante los scripts existentes y
  `npm run build`.
- Copia de `dist/iac-panel-frontend/browser/` a NGINX.
- Runtime: `nginx/nginx-unprivileged:1.30.6-alpine3.24-slim@sha256:016193c18ef1ce19dc2229d3305f69af1b05e0bc0e8fe6ee724a58bd305f3855`.
- Usuario 101, puerto interno 8080, `SIGQUIT` y temporales en `/tmp`.
- Sin Node, npm, `node_modules` ni código fuente en la imagen final.
- Configuración: `app/nginx/default.conf` y `app/nginx/api-proxy.conf`.

API:
- Dockerfile: `app/backend/Dockerfile`.
- Contexto de build: raíz del repositorio.
- Targets: `build`, `prod-deps`, `runtime` y `migration`.
- Runtime basado en Node 24.13.1, usuario `node`, `SIGTERM` y
  `CMD ["node","dist/server.js"]`.
- `npm ci --omit=dev` para el runtime; solo `express` y `pg`.
- `node-pg-migrate`, TypeScript, Vitest y Supertest quedan fuera del runtime.
- El npm global de la imagen base se conserva.
- El target `migration` incluye `node-pg-migrate` y las migraciones SQL; no se
  usa como runtime.
- Las migraciones no se ejecutan al arrancar la API ni desde HTTP.

NGINX:
- Resolver Docker `127.0.0.11 valid=10s ipv6=off`.
- Proxy de `/api` y `/api/` hacia `api:3000`, conservando prefijo y query
  string.
- `/api-docs` devuelve 404 y no se proxifica.
- Fallback SPA solo para rutas de interfaz.
- `UPSTREAM_UNAVAILABLE` como 502 JSON y `UPSTREAM_TIMEOUT` como 504 JSON.
- `PAYLOAD_TOO_LARGE` como 413 JSON cuando NGINX rechaza por transporte.
- `Cache-Control: no-store` en respuestas de API y errores JSON generados por
  NGINX.
- `client_max_body_size 1m`; Express mantiene el límite funcional de 16 KiB.
- Sin caché de respuestas API, sin TLS, sin CORS abierto y sin dominio público.
- La imagen final es el modo con backend configurado. `API_NOT_CONFIGURED`
  queda como modo documental separado sin proxy y no se devuelve cuando una API
  configurada está caída.

PostgreSQL:
- Imagen oficial de la línea 17.
- Etiqueta verificada: `postgres:17.11-bookworm` con digest
  `sha256:665dc7b37ac52a17e298511414c21d23ffa4e6a6ef6225b3e5d59c7afb35e994`.
- Volumen en `/var/lib/postgresql/data`.

Etiquetas de aplicación:
- `iac-panel-api:0.1.0`.
- `iac-panel-web:0.1.0`.
- `iac-panel-api-migrate:0.1.0`.
- Dev y prod pueden reutilizar la misma imagen si comparten versión; la
  configuración de ejecución se define en el despliegue.
- Usar un identificador único por build.
- No reconstruir contenido distinto bajo la misma etiqueta.
- Versión embebida coincide con etiqueta.

Comandos de construcción verificados:

```bash
docker build --platform linux/amd64 -f app/frontend/Dockerfile --target runtime -t iac-panel-web:0.1.0 .
docker build --platform linux/amd64 -f app/backend/Dockerfile --target runtime -t iac-panel-api:0.1.0 .
docker build --platform linux/amd64 -f app/backend/Dockerfile --target migration -t iac-panel-api-migrate:0.1.0 .
```

La etapa inicial sin backend y su respuesta `API_NOT_CONFIGURED` se conservan
como decisión documental separada; no forman parte de esta imagen final.

Terraform no administra la construcción de estas imágenes.
Destruir un entorno no elimina automáticamente las imágenes compartidas.

## 5. Terraform

Implementado en `infra/`:

- `providers.tf`: Terraform `>= 1.9.0, < 2.0.0`, `kreuzwerker/docker ~> 4.6`
  (4.6.0) y `hashicorp/random ~> 3.9` (3.9.1); backend local.
  `.terraform.lock.hcl` versionado con hashes para `windows_amd64` y
  `linux_amd64`.
- `variables.tf`: `environment` (dev/prod), `host_port` (1024–65535),
  `application_version` (semántica), `postgres_image` (obligatoriamente con
  digest) y `docker_host` (opcional).
- `main.tf`: prefijo `iac-panel-{entorno}`, etiquetas comunes
  `com.iac-panel.*` y `terraform_data.workspace_guard`, cuya precondición
  bloquea el plan si el workspace no coincide con `environment` (incluido
  `default`).
- `modules/network`: `frontend-net` y `backend-net` (interna).
- `modules/database`: volumen `pgdata`, contraseñas `random_password` de 32
  caracteres alfanuméricos (administración y aplicación), contenedor
  PostgreSQL solo en `backend-net` con alias `postgres`, healthcheck
  `pg_isready` por TCP y `wait = true`. Un script en
  `/docker-entrypoint-initdb.d/` crea el rol `iac_app` sin privilegios
  administrativos al inicializar un volumen vacío.
- `modules/app`: API en ambas redes (alias `api`), `read_only`, `/tmp` en
  tmpfs, `cap_drop ALL`, `no-new-privileges` y healthcheck con `fetch` de Node;
  NGINX solo en `frontend-net`, publicado en `127.0.0.1:host_port` hacia el
  puerto interno 8080, con las mismas restricciones y healthcheck con `wget`.
- Las imágenes de la aplicación se leen con el data source `docker_image`;
  Terraform no las construye ni las descarga. El contenedor usa el ID de la
  imagen, de modo que un build nuevo provoca su recreación.
- Memoria: PostgreSQL 512 MiB, API 256 MiB y NGINX 128 MiB, con
  `memory_swap` igual a la memoria (sin swap).
- Reinicio `unless-stopped` en los tres contenedores.

Decisiones técnicas tomadas durante la implementación:

- `ipv6` de las redes se ignora con `lifecycle.ignore_changes`: Docker Desktop
  lo activa por defecto y el provider no puede forzarlo a `false`, lo que
  recreaba las redes en cada plan.
- `DB_HOST` de la API es el nombre del contenedor de PostgreSQL (resoluble por
  el DNS de Docker). Es una referencia real que ordena la creación sin
  `depends_on`; recrear PostgreSQL ya no recrea la API ni NGINX.
- El script de inicialización se sube sin `\r` para tolerar clones con CRLF;
  `.gitattributes` fuerza LF en `.sh`, `.tf`, `.sql` y `.conf`.

## 6. Scripts

En infra/scripts/ (implementados; `lib.sh` contiene las funciones comunes):

- build-images.sh VERSION
  Construye las imágenes y devuelve sus etiquetas. Exige que la versión de
  `app/frontend/package.json` y `app/backend/package.json` coincida con
  VERSION, descarga la imagen fijada de PostgreSQL si falta y no reconstruye
  una etiqueta existente.

- deploy.sh ENTORNO VERSION
  Valida herramientas, imágenes, workspace y variables.
  Inicializa Terraform.
  Selecciona o crea workspace.
  Genera plan.
  Solicita aprobación.
  Aplica el plan.
  Espera PostgreSQL.
  Asegura el rol de aplicación (idempotente; repara el caso en que el script
  de inicialización no se ejecutó y sincroniza la contraseña vigente).
  Ejecuta migraciones con credenciales administrativas (imagen
  iac-panel-api-migrate en la red backend; la URL viaja por variable de
  entorno heredada, no como argumento).
  Aplica grant-app-privileges.sql con psql dentro del contenedor.
  Verifica salud a través de NGINX y devuelve URL.
  Si el apply falla, reconcilia el rol si PostgreSQL quedó en pie y termina
  sin borrar volúmenes ni estado; basta con volver a ejecutarlo.

- smoke-test.sh ENTORNO
  Comprueba info, salud y ciclo crear/listar/eliminar.
  Usa un registro temporal identificable.
  Sale con código distinto de cero si falla.

- destroy.sh ENTORNO
  Valida workspace, muestra plan de destrucción y pide confirmación.
  Advierte pérdida del volumen y sus datos.
  Destruye solo el entorno seleccionado.

Los scripts no aceptan entornos distintos de dev/prod.
No utilizan auto-approve ni omiten confirmaciones destructivas: deploy.sh pide
escribir "si" y destroy.sh pide escribir el nombre del entorno.
Las credenciales no se pasan como argumentos visibles ni se imprimen.

Notas para Windows (Git Bash), verificadas:
- `lib.sh` exporta `MSYS_NO_PATHCONV=1` y usa `pwd -W` para pasar rutas
  `C:/...` a `docker` y `terraform`.
- Si `DOCKER_HOST` no está definido, se toma del contexto activo de Docker
  (por ejemplo `npipe:////./pipe/dockerDesktopLinuxEngine`) para que el
  provider use el mismo daemon que la CLI.

## 7. Variables por entorno

dev:
- environment = dev
- host_port = 8080

prod:
- environment = prod
- host_port = 8081

Compartidas:
- application_version (se pasa con -var desde deploy.sh).
- Imágenes derivadas: iac-panel-api:VERSION e iac-panel-web:VERSION.
- Prefijo de recursos por entorno.

Generar contraseñas diferentes por entorno con random_password.
Marcar secretos como sensibles.
No guardar contraseñas en tfvars versionados.

## 8. Secuencia de operación

Desde la raíz (verificada el 2026-11-08):

1. Ejecutar instalación de dependencias y pruebas del frontend
   dentro de contenedores.
2. Construir imágenes con `bash infra/scripts/build-images.sh 0.1.0`.
3. Desplegar dev con `bash infra/scripts/deploy.sh dev 0.1.0`.
4. Comprobar http://127.0.0.1:8080.
5. Ejecutar `bash infra/scripts/smoke-test.sh dev`.
6. Repetir para prod en puerto 8081.
7. Verificar separación de datos.
8. Guardar evidencias sanitizadas.

La aplicación puede responder antes de terminar las migraciones.
El despliegue solo se considera listo después de migración y salud exitosas.

### Migraciones en la etapa actual (Tarea 2)

- Implementadas y verificadas a nivel de backend con PostgreSQL 17 real
  descartable. La integración con Terraform y los scripts de despliegue sigue
  pendiente.
- El comando se ejecuta desde `app/backend` y requiere las dependencias de
  desarrollo/migración instaladas con `npm ci`:
  `npm run db:migrate`.
- Usa `MIGRATION_DATABASE_URL` con credenciales administrativas solo durante su
  ejecución. La API no recibe esa variable.
- Migraciones SQL en `app/database/migrations/`; historial en la tabla
  `pgmigrations`.
- Tras migrar, ejecutar como administrador
  `app/database/scripts/grant-app-privileges.sql` con las variables psql
  `database_name` y `app_user`. El script es idempotente y no contiene
  secretos.
- El rol de aplicación debe existir previamente; su creación corresponde a la
  inicialización del entorno (Terraform en la etapa de infraestructura).
- Reejecutar `npm run db:migrate` sin pendientes no modifica datos.

Mantener README.md alineado con los comandos implementados y el flujo
de trabajo dentro de contenedores.

## 9. Salud y fallos

- PostgreSQL: comprobación con pg_isready.
- API: healthcheck usando /api/health.
- NGINX: healthcheck HTTP local.
- Espera de despliegue limitada a 120 segundos por etapa.
- Fallar con diagnóstico si se supera el límite.
- No borrar volúmenes para resolver automáticamente un fallo.
- No depender solo del orden de creación para asumir disponibilidad.
- Reinicio automático de contenedores: unless-stopped.
- Un contenedor unhealthy no se considera reparado automáticamente.

Si una migración falla:
- Marcar despliegue incompleto.
- Conservar datos y estado.
- Mostrar instrucciones de diagnóstico sin secretos.
- Corregir y reejecutar; no ejecutar rollback destructivo automático.

## 10. Persistencia y destrucción

Recrear un contenedor conservando su volumen mantiene los datos.

La destrucción completa incluye:
- NGINX.
- API.
- PostgreSQL.
- Redes.
- Volumen de datos del entorno.
- Recursos auxiliares gestionados por esa configuración.

No elimina:
- Recursos ajenos al proyecto.
- Imágenes compartidas construidas previamente.
- Código fuente ni documentación.

No eliminar manualmente el estado para limpiar infraestructura.

## 11. Secretos y repositorio

Excluir:
- .terraform/
- terraform.tfstate.d/
- *.tfstate
- *.tfstate.*
- *.tfplan
- .env
- dumps y copias de seguridad
- tfvars con secretos

Versionar:
- .terraform.lock.hcl
- package-lock.json
- ejemplos sin credenciales
- tfvars que no contengan secretos

El estado local no está cifrado por sensitive=true.
Guardarlo con permisos restringidos y fuera de evidencias públicas.

## 12. Respaldo

El proyecto usa datos descartables; el respaldo no es obligatorio para
la prueba de destrucción.

Antes de conservar datos importantes:
- Exportar con pg_dump.
- Guardar la copia fuera de Git.
- Restaurar con pg_restore según el formato elegido.
- Verificar registros después de restaurar.

No afirmar recuperación probada sin ejecutarla.

## 13. Defensa sin internet

- Descargar providers e imágenes previamente.
- Construir y probar ambas imágenes.
- Conservar el directorio inicializado.
- Probar el procedimiento desconectado.
- No borrar cachés antes de la defensa.
- Llevar evidencias y video de respaldo.
- Tener el código y dependencias necesarios disponibles localmente.

### Contexto de construcción del frontend

- Dockerfile: app/frontend/Dockerfile.
- Contexto de construcción: raíz del repositorio.
- Archivo de exclusiones común: .dockerignore en la raíz.
- La configuración de NGINX se obtiene desde app/nginx/default.conf.
- Las instrucciones COPY deben seleccionar explícitamente los archivos necesarios.

Los comandos de construcción se ejecutan desde la raíz:

docker build \
  --target runtime \
  -f app/frontend/Dockerfile \
  -t iac-panel-web:ETIQUETA \
  .

ETIQUETA es un marcador y debe sustituirse por la versión correspondiente.
Este comando es el procedimiento previsto hasta que se implemente y verifique.