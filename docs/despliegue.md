# Despliegue — Panel de verificación IaC

## 1. Estado

Procedimiento objetivo pendiente de implementación y verificación.
Los scripts mencionados deben crearse; este documento no afirma su existencia.

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
- No usar latest.
- No actualizar dependencias durante la defensa.

## 4. Imágenes

Construcción previa a Terraform.

API:
- Build multietapa.
- Compilar TypeScript.
- Incorporar dependencias runtime.
- Incorporar migraciones; la herramienta de migración puede incluirse para la
  operación administrativa, pero el proceso runtime no la requiere.
- Ejecutar API como usuario no root.

Frontend:
- Inicializar Angular mediante un contenedor temporal de Node.js,
  conservando el código en app/frontend/.
- Mantener Angular 21 en modo zoneless.
- Dockerfile en app/frontend/Dockerfile, con etapas development,
  build y runtime.
- Contexto de build: raíz del repositorio.
- .dockerignore en la raíz para controlar ese contexto.
- Compilar Angular.
- Copiar resultado a imagen NGINX.
- Incorporar configuración de app/nginx/default.conf.
- Incluir logo y recursos locales.

Etapa inicial sin backend:
- No configurar proxy /api ni activar simulación.
- NGINX devuelve HTTP 404 con JSON para /api y /api/*, indicando que la API
  todavía no está configurada:
  `{"error":{"code":"API_NOT_CONFIGURED","message":"La API aún no está configurada."}}`.
- Esas rutas no deben devolver el HTML de Angular mediante el fallback SPA.
- Al integrar el backend, sustituir esta respuesta temporal por el proxy
  definido en la arquitectura final.

PostgreSQL:
- Imagen oficial de la línea 17.
- Etiqueta verificada: `postgres:17.11-bookworm` con digest
  `sha256:665dc7b37ac52a17e298511414c21d23ffa4e6a6ef6225b3e5d59c7afb35e994`.
- Volumen en /var/lib/postgresql/data.

Etiquetas de aplicación:
- iac-panel-api:{version}.
- iac-panel-web:{version}.
- Usar un identificador único por build.
- No reconstruir contenido distinto bajo la misma etiqueta.
- Versión embebida coincide con etiqueta.
- Estado dev/prod usan la versión indicada en sus tfvars.

Terraform no administra la construcción de estas imágenes.
Destruir un entorno no elimina automáticamente las imágenes compartidas.

## 5. Scripts que deben implementarse

En infra/scripts/:

- build-images.sh VERSION
  Construye las imágenes y devuelve sus etiquetas.

- deploy.sh ENTORNO VERSION
  Valida herramientas, imágenes, workspace y variables.
  Inicializa Terraform.
  Selecciona o crea workspace.
  Genera plan.
  Solicita aprobación.
  Aplica el plan.
  Espera PostgreSQL.
  Ejecuta migraciones con credenciales administrativas.
  Verifica salud y devuelve URL.

- smoke-test.sh ENTORNO
  Comprueba info, salud y ciclo crear/listar/eliminar.
  Usa un registro temporal identificable.
  Sale con código distinto de cero si falla.

- destroy.sh ENTORNO
  Valida workspace, muestra plan de destrucción y pide confirmación.
  Advierte pérdida del volumen y sus datos.
  Destruye solo el entorno seleccionado.

Los scripts no aceptan entornos distintos de dev/prod.
No utilizan auto-approve ni omiten confirmaciones destructivas.
Las credenciales no se pasan como argumentos visibles ni se imprimen.

## 6. Variables por entorno

dev:
- environment = dev
- host_port = 8080

prod:
- environment = prod
- host_port = 8081

Compartidas:
- application_version.
- api_image y frontend_image.
- Prefijo de recursos por entorno.

Generar contraseñas diferentes por entorno con random_password.
Marcar secretos como sensibles.
No guardar contraseñas en tfvars versionados.

## 7. Secuencia de operación

Desde la raíz, una vez implementados los scripts:

1. Ejecutar instalación de dependencias y pruebas del frontend
   dentro de contenedores.
2. Construir imágenes con build-images.sh VERSION.
3. Desplegar dev mediante deploy.sh dev VERSION.
4. Comprobar http://127.0.0.1:8080.
5. Ejecutar smoke-test.sh dev.
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

## 8. Salud y fallos

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

## 9. Persistencia y destrucción

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

## 10. Secretos y repositorio

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

## 11. Respaldo

El proyecto usa datos descartables; el respaldo no es obligatorio para
la prueba de destrucción.

Antes de conservar datos importantes:
- Exportar con pg_dump.
- Guardar la copia fuera de Git.
- Restaurar con pg_restore según el formato elegido.
- Verificar registros después de restaurar.

No afirmar recuperación probada sin ejecutarla.

## 12. Defensa sin internet

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