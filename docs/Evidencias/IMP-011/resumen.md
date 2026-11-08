# Evidencias — Terraform y scripts de despliegue (IMP-011)

Fecha: 2026-11-08.

## Entorno de ejecución

- Windows 11 Pro (10.0.26200), Git Bash.
- Docker Desktop, Docker Engine 29.6.2; VM con 12 CPU y ~3.9 GB de memoria.
- Terraform v1.17.0 (windows_amd64).
- Providers: `kreuzwerker/docker` 4.6.0 y `hashicorp/random` 3.9.1.
- Imágenes de la aplicación 0.1.0 construidas con `infra/scripts/build-images.sh 0.1.0`:
  `iac-panel-web` (21.5 MB), `iac-panel-api` (328 MB) e `iac-panel-api-migrate` (560 MB).
- Rama: `feat/terraform-infra`.

## Resultados

| ID | Prueba | Resultado | Evidencia |
|---|---|---|---|
| PI-01 | Formato y validación | APROBADA | `pi01-formato-validacion.txt` |
| PI-02 | Despliegue desde prerrequisitos | APROBADA | `pi15-recrear-dev.txt` (despliegue completo desde cero), `smoke-dev.txt` |
| PI-03 | Reaplicar migraciones | APROBADA | `pi15-recrear-dev.txt`; las reejecuciones de `deploy.sh` respondieron `No migrations to run!` |
| PI-04 | Plan posterior estable | APROBADA | `pi04-plan-estable.txt` (dev y prod, exit 0) |
| PI-05 | Recrear API | APROBADA | `pi05-recrear-api.txt` |
| PI-06 | Recrear BD manteniendo volumen | APROBADA | `pi06-recrear-bd-volumen.txt` |
| PI-07 | Inspeccionar puertos | APROBADA | `pi07-08-puertos-redes.txt` |
| PI-08 | Inspeccionar redes | APROBADA | `pi07-08-puertos-redes.txt` |
| PI-09 | Ejecutar dev y prod | APROBADA | `pi09-dev-prod-paralelo.txt`, `smoke-prod.txt` |
| PI-10 | Variables/workspace discordantes | APROBADA | `pi10-workspace-guard.txt` |
| PI-11 | Cambiar puerto de prueba | APROBADA | `pi11-cambio-puerto.txt` |
| PI-12 | Eliminar API manualmente | APROBADA | `pi12-13-drift-recuperacion.txt` |
| PI-13 | Aplicar recuperación | APROBADA | `pi12-13-drift-recuperacion.txt` |
| PI-14 | Destruir dev | APROBADA | `pi14-destruir-dev.txt` |
| PI-15 | Recrear tras destrucción total | APROBADA | `pi15-recrear-dev.txt` |
| PI-16 | Privilegios API | APROBADA | `pi16-privilegios.txt` |
| PI-17 | Revisar secretos | APROBADA | `pi17-secretos.txt` |
| PI-18 | Defensa desconectada | APROBADA (simulada) | `pi18-sin-internet-simulado.txt` |
| PI-19 | Nueva versión de imagen | APROBADA | `pi19-nueva-version.txt`, `navegador/dev-estado-0.1.1.jpg` |

Capturas de la interfaz servida por la infraestructura desplegada (navegador
integrado, 800×600): `navegador/dev-estado.jpg`, `navegador/dev-registros.jpg`
`navegador/prod-estado.jpg` y `navegador/dev-estado-0.1.1.jpg` (dev con la
versión 0.1.1 durante PI-19).

PI-18 se simuló con `HTTP(S)_PROXY` apuntando a un puerto cerrado
(`127.0.0.1:9`) y `NO_PROXY=127.0.0.1,localhost`: Terraform y curl no tenían
acceso a internet. No desconecta el daemon de Docker; se recomienda repetirla
con la red del equipo desconectada antes de la defensa.

PI-19 subió temporalmente la versión de `package.json` a 0.1.1, construyó las
imágenes 0.1.1, desplegó dev (solo se recrearon API y NGINX), verificó 0.1.1
en `/api/info` y en la interfaz, y volvió a 0.1.0 (rollback) conservando los
datos. El cambio de versión se revirtió en el código.

## Incidencias encontradas y corregidas durante la validación

1. **Rutas en Git Bash.** Con `MSYS_NO_PATHCONV=1`, `docker` y `terraform`
   recibían rutas `/c/...` que no entienden. `lib.sh` usa `pwd -W` para pasar
   rutas `C:/...`; `smoke-test.sh` convierte el archivo temporal con `cygpath`.
2. **Deriva por `memory_swap`.** Docker asigna por defecto el doble de la
   memoria; el plan intentaba volver a `null`. Se fija `memory_swap = memory`
   (sin swap), que coincide con la política del proyecto.
3. **Deriva por IPv6.** Docker Desktop crea las redes con IPv6 activado y el
   provider no puede forzarlo a `false`. Se ignora el atributo con
   `lifecycle { ignore_changes = [ipv6] }`. Un apply intermedio falló al
   intentar recrear una red con PostgreSQL conectado; el siguiente despliegue
   recreó la API y NGINX sin pérdida de datos.
4. **Recreaciones innecesarias.** Un `depends_on` a nivel de módulo obligaba a
   recrear la API y NGINX al recrear PostgreSQL. Se reemplazó por una
   referencia real (`DB_HOST` = nombre del contenedor de PostgreSQL).
5. **`instanceId` fijo.** El `hostname` explícito impedía ver la recreación de
   la API; se eliminó y `instanceId` vuelve a ser el ID corto del contenedor.
6. **CRLF en el script de inicialización.** Archivos editados en Windows
   quedaron con CRLF y el script que crea el rol `iac_app` falló en prod
   (`set: pipefail: invalid option name`). Se convirtieron a LF, se añadió
   `.gitattributes` (LF para `.sh`, `.tf`, `.sql`, etc.), Terraform elimina
   `\r` del script y `deploy.sh` incorpora una etapa idempotente que asegura el
   rol de aplicación. El despliegue de prod se completó en el segundo intento
   sin borrar el volumen.
7. **Salida sensible en una evidencia.** `terraform output <nombre>` imprime el
   valor aunque sea sensible. Se eliminó la línea de `pi17-secretos.txt`, se
   comprobó que no queda en el repositorio y se recreó dev para generar
   contraseñas nuevas.
8. **Despliegue sin internet.** `terraform init` consulta el registro aunque
   los providers estén instalados, así que `deploy.sh` fallaba sin conexión
   (lo detectó PI-18). `tf_init()` en `lib.sh` omite `init` si `.terraform/`
   existe y `terraform validate` pasa.

## Limitaciones

- Las variables de entorno con contraseñas son visibles con `docker inspect`
  para quien tenga acceso al daemon; el estado local de Terraform las guarda
  en texto plano (`sensitive` no cifra el estado).
- PostgreSQL confía en las conexiones locales del propio contenedor
  (`127.0.0.1`/socket), según la configuración de la imagen oficial; desde la
  red backend exige contraseña (`scram-sha-256`).
- No se probó en Linux ni macOS; el lock file incluye hashes para
  `windows_amd64` y `linux_amd64`.
