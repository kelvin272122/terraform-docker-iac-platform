# Bitácora de implementaciones

## Estados
- EN_CURSO: trabajo iniciado y todavía incompleto.
- IMPLEMENTADA_PENDIENTE_VALIDACION: código implementado con verificaciones pendientes.
- COMPLETADA: criterios y validaciones obligatorios satisfechos.
- BLOQUEADA: no se puede continuar sin resolver una dependencia o decisión.
- REQUIERE_REVISION: se detectó un problema o incertidumbre que debe evaluarse.
- DESCARTADA: implementación abandonada o reemplazada; indicar motivo.

## Índice

| ID | Implementación | Área | Estado | Última actualización |
|---|---|---|---|---|
| IMP-001 | Inicialización y compilación base Angular 21 | Frontend | COMPLETADA | 2026-11-04 |
| IMP-002 | Verificación de pruebas y arranque del frontend | Frontend | COMPLETADA | 2026-11-04 |
| IMP-003 | Deuda de seguridad npm: glob y minimatch | Frontend | REQUIERE_REVISION | 2026-11-05 |
| IMP-004 | Primera estructura visual del panel | Frontend | COMPLETADA | 2026-11-05 |
| IMP-005 | Endurecimiento del entorno de desarrollo | Frontend | COMPLETADA | 2026-11-05 |
| IMP-006 | Base de API Express y contrato inicial | Backend | COMPLETADA | 2026-11-05 |
| IMP-007 | PostgreSQL, migraciones, pool y `/api/health` | Backend / Base de datos | COMPLETADA | 2026-11-07 |
| IMP-008 | Operaciones HTTP de Registros | Backend / API | COMPLETADA | 2026-11-07 |
| IMP-009 | Integración del frontend con la API real | Frontend / Integración | IMPLEMENTADA_PENDIENTE_VALIDACION | 2026-11-07 |

## Registro

### IMP-001 — Inicialización y compilación base Angular 21

- Inicio: 2026-11-04
- Última actualización: 2026-11-04
- Área: Frontend
- Estado: COMPLETADA
- Requerimientos relacionados: base de RF-01 a RF-07; arquitectura §4; despliegue §4.

#### Cambios realizados
- Se generó un workspace Angular 21 en un contenedor temporal y se copió a
  `app/frontend/` sin crear un repositorio Git anidado ni una carpeta
  `app/frontend/frontend/`.
- Se conservó `app/frontend/AGENTS.md`; su hash SHA-256 no cambió.
- Configuración generada: componentes standalone, routing, SCSS, TypeScript
  estricto, modo zoneless y sin SSR.
- Se generó y conservó `app/frontend/package-lock.json`.
- No se creó Dockerfile ni configuración NGINX; quedan fuera de esta tarea.

#### Archivos relevantes
- `app/frontend/package.json`
- `app/frontend/package-lock.json`
- `app/frontend/angular.json`
- `app/frontend/tsconfig.json`
- `app/frontend/src/`
- `app/frontend/public/`
- `README.md`

#### Validaciones
- Generación con `npx --yes @angular/cli@21.2.29 new ...` dentro de
  `node:24.13.1-bookworm-slim`:
  resultado real: workspace creado sin `.git` y sin `AGENTS.md` generado.
- `npm install` en `app/frontend/` dentro del contenedor:
  resultado real: 469 paquetes instalados y `package-lock.json` generado.
- `npm ci` en `app/frontend/` dentro del contenedor:
  resultado real: 473 paquetes instalados desde el lock, sin eliminar
  manualmente `node_modules`.
- `npm run build` en `app/frontend/` dentro del contenedor:
  resultado real: compilación correcta; salida en
  `dist/iac-panel-frontend/browser/`; bundle inicial de 214.35 kB.
- Comprobaciones de alcance: `AGENTS.md` presente y sin cambios; sin
  `app/frontend/frontend/`; sin `app/frontend/.git`; sin `server.ts`;
  sin `zone.js` en `package.json` ni en `angular.json`; sin
  `provideZoneChangeDetection` en `src/`.
- Verificaciones no ejecutadas y motivo:
  - Interfaz en navegador: no se levantó el servidor de desarrollo ni se
    publicó ningún puerto; no forma parte de la autorización.
  - `npm test`: no ejecutado; no estaba incluido en el bloque autorizado.
  - `npm audit fix`: no ejecutado; `npm audit` reportó 16 vulnerabilidades
    moderadas y corregirlas queda fuera del alcance de esta tarea.

#### Documentación
- Documentos actualizados: `README.md`, `BITACORA.md`, `MEMORIA.md`.
- `docs/despliegue.md` revisado: sin cambios en esta implementación; los
  comandos verificados se documentan en `README.md`.
- README: actualizado con estado, prerrequisitos y comandos verificados.
- Memoria: actualizada.
- Pendiente documental para NGINX: `docs/arquitectura.md` (§10) define `/api`
  como 404 JSON y `docs/despliegue.md` (§4) como 404 en texto plano. No se
  modificó ninguna de las dos versiones en esa tarea; la contradicción se
  corrigió en IMP-006.

#### Pendientes o revisión
- Construir el dashboard, incorporar Angular Material y las funcionalidades
  de estado y registros.
- Integrar la API y definir la respuesta temporal de `/api` para NGINX.
- Crear el Dockerfile del frontend y la configuración NGINX.
- Ejecutar pruebas unitarias y validación en navegador cuando corresponda.

#### Próximo paso
- Implementar la estructura del dashboard Angular sin ampliar el alcance de
  infraestructura.

### IMP-002 — Verificación de pruebas y arranque del frontend

- Inicio: 2026-11-04
- Última actualización: 2026-11-04
- Área: Frontend
- Estado: COMPLETADA
- Requerimientos relacionados: RF-07 y base de RF-01 a RF-06; arquitectura §4; despliegue §4.

#### Cambios realizados
- No se modificó código de la aplicación ni se agregaron dependencias.
- Se ejecutaron las pruebas unitarias con `--watch=false`.
- Se inició el servidor de desarrollo en un contenedor temporal con nombre
  único, escucha en `0.0.0.0:4200` y publicación exclusiva en
  `127.0.0.1:4200`.
- Se detuvo y eliminó únicamente ese contenedor temporal.

#### Archivos relevantes
- `app/frontend/package.json`
- `app/frontend/src/app/app.spec.ts`
- `README.md`

#### Validaciones
- `npm test -- --watch=false` dentro de `node:24.13.1-bookworm-slim`:
  resultado real: 1 archivo de pruebas y 2 pruebas aprobadas.
- Disponibilidad previa del puerto 4200 en el host: libre.
- Arranque del contenedor: listo aproximadamente 4 s después del inicio.
- Escucha interna: `/proc/net/tcp` mostró `00000000:1068`, equivalente a
  `0.0.0.0:4200`.
- Publicación en el host: `docker port` mostró
  `4200/tcp -> 127.0.0.1:4200`; `docker inspect` confirmó
  `HostIp=127.0.0.1` y `HostPort=4200`.
- Respuesta HTTP: `GET http://127.0.0.1:4200/` devolvió 200, 443 bytes y
  el HTML contenía `<app-root>`.
- Logs relevantes: `Local: http://localhost:4200/` y
  `Network: http://172.17.0.2:4200/`, con compilación correcta.
- Limpieza: contenedor temporal eliminado; puerto 4200 libre al finalizar.
- Verificaciones no ejecutadas y motivo:
  - Renderizado en navegador: pendiente; no se abrió un navegador real.
  - `curl` solo comprobó respuesta HTTP y HTML inicial, no renderizado.

#### Documentación
- Documentos actualizados: `README.md`, `BITACORA.md`, `MEMORIA.md`.
- README: actualizado con pruebas, arranque, puerto y estado de verificación.
- Memoria: actualizada.
- `docs/despliegue.md` sin cambios en esta implementación.

#### Pendientes o revisión
- Continuar con Angular Material y la estructura del dashboard.
- Mantener pendiente la contradicción de `/api` para la tarea de NGINX.
- No se confirmó que la consola del navegador esté libre de errores.

#### Actualización — Validación visual manual del usuario (2026-11-04)
- El usuario confirmó manualmente que la página inicial
  «Hello, iac-panel-frontend» se muestra en `http://localhost:4200/` y en
  `http://127.0.0.1:4200/`.
- Esta comprobación es manual y no fue ejecutada ni automatizada por el agente.
- No se confirmó que la consola del navegador esté libre de errores.
- Se conserva el registro anterior: durante la ejecución de IMP-002 el
  renderizado en navegador estaba pendiente y `curl` solo comprobó la
  respuesta HTTP y el HTML inicial.

#### Próximo paso
- Implementar Angular Material y la estructura del dashboard sin ampliar
  el alcance de infraestructura.

### IMP-003 — Deuda de seguridad npm: glob y minimatch

- Inicio: 2026-11-04
- Última actualización: 2026-11-05
- Área: Frontend
- Estado: REQUIERE_REVISION
- Requerimientos relacionados: arquitectura §4; política de versiones de despliegue §3.

#### Cambios realizados
- No se modificaron dependencias, código ni `package.json`/`package-lock.json`.
- Se diagnosticaron y registraron las alertas de seguridad de npm.
- Se decidió mantener las versiones actuales para el desarrollo local y
  tratar las alertas como deuda de seguridad pendiente, no como corregidas.
- No se ejecutó `npm audit fix`, no se añadieron overrides y no se degradó
  Angular CLI.

#### Archivos relevantes
- `app/frontend/package.json`
- `app/frontend/package-lock.json`
- `BITACORA.md`
- `MEMORIA.md`
- `README.md`

#### Validaciones y resultados observados
- Comandos ejecutados en el contenedor documentado con `app/frontend`
  montado en solo lectura: `npm ls glob minimatch @angular/cli --all`,
  `npm explain glob`, `npm explain minimatch`, `npm audit --json`,
  `npm audit --omit=dev --json` y consultas de versiones publicadas.
- Versiones instaladas: `@angular/cli@21.2.29`, `pacote@21.5.1`,
  `glob@13.0.6` y `minimatch@10.2.6`; las dos últimas marcadas como
  desarrollo y deduplicadas.
- Cadena afectada:
  `@angular/cli@21.2.29 → pacote@21.5.1 → @npmcli/package-json@7.0.5 y
  cacache@20.0.4 → glob@13.0.6 → minimatch@10.2.6`; además
  `npm-packlist@10.0.4 → ignore-walk@8.0.0 → minimatch@10.2.6` y
  `sigstore@4.1.1 → @sigstore/tuf@4.0.2 → tuf-js@4.1.0 →
  @tufjs/models@4.1.0 → minimatch@10.2.6`.
- Alertas:
  - `GHSA-3g3m-2fjr-6pw4`: `glob` 9.0.0–14.0.1; instalado 13.0.6.
  - `GHSA-g3hv-75wg-m249`: `minimatch` 7.0.0–<11.0.1; instalado 10.2.6.
- `npm audit --json`: 16 vulnerabilidades moderadas, 0 altas, 0 críticas.
- `npm audit --omit=dev --json`: 0 vulnerabilidades en el alcance auditado
  sin dependencias de desarrollo (10 de producción y 566 de desarrollo).
  No inspecciona el bundle generado; por sí solo no demuestra la ausencia de
  los paquetes afectados en el bundle, solo que quedan fuera del alcance
  auditado de producción.
- Versiones corregidas publicadas: `glob >=14.0.2` (última 14.0.3) y
  `minimatch >=11.0.1` (última 11.0.4).
- Compatibilidad: no hay corrección dentro de Angular 21. La última CLI 21
  es 21.2.29 y fija `pacote@21.5.1`; `pacote@21.5.2` mantiene los mismos
  rangos. Incluso las últimas versiones de los padres consultados mantienen
  `glob ^13.0.0` o `minimatch ^10.x`. No se presupone que subir `pacote`,
  Angular CLI o Angular resuelva las alertas.

#### Decisión y mitigación
- Mantener por ahora las versiones actuales para el desarrollo local.
- Las alertas quedan pendientes de resolución y no se silencian ni se
  eliminan de las verificaciones.
- La corrección forzada (`npm audit fix --force`) se descartó porque propone
  degradar Angular CLI; no se aplicó.
- Docker es una mitigación parcial: las herramientas siguen ejecutándose y
  el montaje de `app/frontend` permite modificar archivos del host. Se
  mantienen montajes mínimos, sin credenciales ni socket de Docker.
- Responsable de seguimiento: mantenedor del proyecto.

#### Revisión obligatoria
- Revisar la cadena antes de incorporar Angular Material, ante una
  actualización relevante y antes de una entrega o despliegue.
- Verificar las versiones transitivas realmente resueltas y volver a
  ejecutar auditoría, compilación y pruebas antes de proponer una
  actualización.

#### Actualización — Revisión tras instalar Material/CDK (2026-11-05)
- Se instalaron `@angular/material@21.2.14` y `@angular/cdk@21.2.14`.
- `npm audit --json` mantuvo 16 alertas moderadas, 0 altas y 0 críticas, con
  la misma cadena de `glob@13.0.6` y `minimatch@10.2.6`.
- `npm audit --omit=dev --json` mantuvo 0 vulnerabilidades en el alcance
  auditado sin dependencias de desarrollo.
- No se identificaron alertas nuevas atribuibles a Material o CDK.
- La deuda sigue pendiente; no se ejecutó `npm audit fix` ni se añadieron
  overrides.

#### Actualización — Mitigación de entorno (2026-11-05)
- Se validó el perfil endurecido registrado en IMP-005 para los comandos de
  desarrollo.
- La mitigación reduce el impacto de ejecuciones comprometidas, pero no
  corrige las CVE de `glob`/`minimatch` ni elimina la deuda.
- IMP-003 permanece abierta y debe revisarse antes de una entrega o
  despliegue.

#### Documentación
- Documentos actualizados: `README.md`, `BITACORA.md`, `MEMORIA.md`.
- README raíz: nota breve con referencia a este registro.
- README del frontend: revisado; ya estaba en español y sin duplicar comandos
  Docker, sin cambios adicionales en esta revisión.
- Memoria: actualizada con la deuda y los disparadores de revisión.

#### Pendientes o revisión
- Resolver las alertas cuando exista una ruta compatible verificada.
- No ejecutar `npm audit fix`, overrides ni degradaciones de Angular CLI.

#### Próximo paso
- Continuar el desarrollo local manteniendo la deuda registrada; revisar la
  cadena antes de Angular Material.

### IMP-004 — Primera estructura visual del panel

- Inicio: 2026-11-05
- Última actualización: 2026-11-05
- Área: Frontend
- Estado: COMPLETADA
- Requerimientos relacionados: RF-01 (base), RF-07; requerimientos §7; arquitectura §4; pruebas PF-01, PF-19, PF-20 y PF-21.

#### Cambios realizados
- Se instalaron exactamente `@angular/material@21.2.14` y
  `@angular/cdk@21.2.14`; no se añadió `@angular/animations`.
- Se sustituyó la bienvenida inicial por un shell con barra superior, marca
  local, navegación lateral y `router-outlet`.
- Se implementaron las rutas `/estado`, `/registros`, la redirección de `/` a
  `/estado` y la página 404 para rutas desconocidas.
- La navegación usa una consulta explícita `(min-width: 960px)`: sidenav
  lateral abierto desde 960 px y panel temporal cerrado por debajo, con botón
  de menú y cierre al navegar.
- Estado muestra tarjetas de Entorno, Versión de la interfaz, API y
  PostgreSQL con textos neutrales, sin llamadas a `/api`, sin métricas
  ficticias y con el botón Actualizar deshabilitado.
- Registros muestra únicamente el encabezado y el mensaje «Funcionalidad
  pendiente de implementación»; no incluye formulario, listado ni simulación.
- Se añadió un logo SVG local, paleta clara aprobada, tipografía del sistema,
  `lang="es"`, título descriptivo y foco visible.
- Se eliminaron con `rmdir` los directorios vacíos propiedad de `root`
  `app/frontend/app/frontend/` y `app/frontend/app/`.

#### Archivos relevantes
- `app/frontend/package.json`
- `app/frontend/package-lock.json`
- `app/frontend/src/app/app.ts`, `app.html`, `app.scss`
- `app/frontend/src/app/app.routes.ts`
- `app/frontend/src/app/app.spec.ts`
- `app/frontend/src/app/app.routes.spec.ts`
- `app/frontend/src/app/features/status/`
- `app/frontend/src/app/features/records/`
- `app/frontend/src/app/shared/not-found/`
- `app/frontend/src/index.html`
- `app/frontend/src/styles.scss`
- `app/frontend/public/logo.svg`

#### Validaciones
- Versiones resueltas: Material y CDK `21.2.14`, Angular `21.2.26`, CLI y
  `@angular/build` `21.2.29`, TypeScript `5.9.3`.
- `package-lock.json`: solo se añadieron Material y CDK; `parse5@8.1.0` y
  `entities@9.0.0` cambiaron de marca dev a producción sin cambiar de versión.
- `npm ci`: 475 paquetes instalados; reportó 16 vulnerabilidades moderadas.
- `npm run build`: correcto; bundle inicial de 385.95 kB y chunks diferidos
  para estado, registros y 404.
- `npm test -- --watch=false`: 5 archivos y 9 pruebas aprobadas.
- `npm audit --json`: exit code 1 por 16 vulnerabilidades moderadas, 0 altas y
  0 críticas; misma cadena `glob@13.0.6`/`minimatch@10.2.6`.
- `npm audit --omit=dev --json`: exit code 0; 0 vulnerabilidades en el alcance
  auditado sin dependencias de desarrollo. No inspecciona el bundle generado.
- Los códigos de salida corresponden a vulnerabilidades detectadas y a un
  alcance limpio; no hubo errores de ejecución ni de conexión al registro.
- No aparecieron alertas nuevas atribuibles a Material o CDK.
- Contraste comprobado: texto/fondo 13.76:1, texto/superficie 14.76:1,
  secundario/fondo 6.02:1, principal/superficie 11.50:1,
  blanco/principal 11.50:1 y foco/fondo 6.42:1.
- Arranque en contenedor: HTTP 200 en `/`, `/estado`, `/registros` y
  `/ruta-inexistente`; `/logo.svg` respondió 200; `lang="es"`, título
  correcto y `<app-root>` presentes. Publicación solo en `127.0.0.1:4200`.
- `src` y `public` no contienen `HttpClient`, llamadas a `/api`, fuentes
  externas ni iconos externos.
- Verificaciones no ejecutadas o pendientes:
  - Renderizado real en navegador de esta nueva interfaz: pendiente.
  - Consola del navegador libre de errores: no comprobada.
  - Comportamiento visual a 360 px y navegación por teclado en navegador real:
    pendiente. Las pruebas cubren el cambio de modo y el cierre del menú al
    navegar, no el layout real.

#### Actualización — Validación manual del usuario (2026-11-05)
- El usuario validó manualmente la nueva interfaz en un navegador real. Esta
  comprobación no fue ejecutada ni automatizada por el agente.
- Comprobaciones aprobadas: renderizado de Estado; redirección `/` →
  `/estado`; navegación Estado/Registros; acceso directo y recarga de
  `/registros`; página 404 y enlace de regreso; consola sin errores de la
  aplicación observados; red sin solicitudes a `/api` observadas; recursos sin
  dependencias externas de la aplicación observadas; vista móvil de 360 px;
  cambio entre 959 y 960 px; apertura y cierre del menú móvil; navegación por
  teclado y foco visible; enlace «Saltar al contenido».
- Incidencias observadas: ninguna. Capturas: no se tomaron.
- Alcance: esta validación cubre la interfaz y el servidor de desarrollo. No
  verifica NGINX, Terraform, el despliegue final ni la integración con la API.

#### Documentación
- Documentos actualizados: `README.md`, `MEMORIA.md`, `BITACORA.md`,
  `app/frontend/README.md`, `docs/pruebas.md` y `docs/arquitectura.md`.
- `docs/pruebas.md`: se ajustó `npm run test:run` al comando verificado
  `npm test -- --watch=false`; no se creó un script nuevo. También se registró
  la validación manual de la interfaz inicial.
- Cierre de validación: se actualizaron `README.md`, `MEMORIA.md`,
  `BITACORA.md` y `app/frontend/README.md` para reflejar la comprobación
  manual del usuario.

#### Pendientes o revisión
- Los pendientes de validación visual y de navegador quedaron resueltos por la
  comprobación manual del usuario.
- Integración API, comprobaciones reales de servicios, formularios y listados:
  pendientes.
- Alertas de seguridad de `glob`/`minimatch`: pendientes de resolución,
  registradas en IMP-003.
- NGINX, Terraform y despliegue final: pendientes.

#### Próximo paso
- Planificar formularios y listados sin iniciar su implementación en esta
  tarea.

### IMP-005 — Endurecimiento del entorno de desarrollo

- Inicio: 2026-11-05
- Última actualización: 2026-11-05
- Área: Frontend / entorno de desarrollo
- Estado: COMPLETADA
- Requerimientos relacionados: IMP-003; política de versiones de despliegue §3.

#### Contexto y alcance
- Tarea separada de IMP-004; no reabre la interfaz ni su validación.
- No se modificaron código, dependencias, configuración Angular, SELinux,
  permisos del host ni configuración del daemon.
- No se ejecutó `npm audit fix`, no se usaron overrides y no se degradó Angular
  CLI.
- IMP-003 sigue abierta: las CVE de `glob`/`minimatch` no se han corregido.

#### Entorno observado
- Fedora 44, 16 vCPU, ~15 GiB de RAM y 8 GiB de swap.
- Docker 29.9.0 en modo **rootful**.
- Cgroups v2 con driver `systemd`; controladores `cpu`, `memory` y `pids`.
- Docker reportó soporte para `MemoryLimit`, `SwapLimit`, `PidsLimit` y
  `CpuCfsQuota`.
- SELinux en `Enforcing`; no se modificó.
- Rootless no activo; socket en `/var/run/docker.sock` con propietario
  `root:docker`.

#### Perfil validado
- Usuario no root `$(id -u):$(id -g)`.
- `--cap-drop=ALL`.
- `--security-opt=no-new-privileges:true`.
- `--pids-limit=512`.
- Instalación, pruebas y servidor: `--cpus=2 --memory=2g --memory-swap=2g`.
- Compilación: `--cpus=4 --memory=4g --memory-swap=4g`.
- `--read-only`.
- `--tmpfs /tmp:rw,nosuid,nodev,size=1g,mode=1777`.
- Montaje limitado a `app/frontend:/app:rw`.
- Servidor con `--init` y publicación exclusiva en `127.0.0.1:4200`.

#### Controles solicitados y comprobados
- Configuración solicitada: límites anteriores, capacidades eliminadas,
  `no-new-privileges`, raíz de solo lectura, `/tmp` en tmpfs y montaje único.
- Comprobado con contenedor de control:
  `NanoCpus=2000000000`, `Memory=2147483648`, `MemorySwap=2147483648`,
  `PidsLimit=512`, `CapDrop=["ALL"]`,
  `SecurityOpt=["no-new-privileges:true"]`, `ReadonlyRootfs=true`.
- Comprobado dentro del contenedor: `uid=1000`, `gid=1000`,
  `memory.max=2147483648`, `pids.max=512`, `cpu.max=200000 100000`,
  `CapEff=0000000000000000`, `NoNewPrivs=1`, raíz `overlay ... ro` y
  `/tmp` como tmpfs de 1 GiB.
- Publicación comprobada: `4200/tcp -> 127.0.0.1:4200`.

#### Resultados de las operaciones
- `npm ci`: exit 0, 9 s, 475 paquetes; 16 alertas moderadas; `OOMKilled=false`.
- `npm run build`: exit 0, 3 s; bundle inicial de 385.95 kB;
  `OOMKilled=false`.
- `npm test -- --watch=false`: exit 0, 17 s; 5 archivos y 9 pruebas aprobadas;
  `OOMKilled=false`.
- `npm start`: listo en 6 s; HTTP 200 en `/`, `/estado`, `/registros`,
  `/ruta-inexistente` y `/logo.svg`; publicación solo en `127.0.0.1:4200`.
- No se observaron códigos 125, 126 o 127 ni fallos de red.
- Hashes sin cambios:
  - `app/frontend/package.json`:
    `336728cef1df56cb11e0dce250e28ead659164ba6cbdaa6e214e74925ba0a3f4`.
  - `app/frontend/package-lock.json`:
    `8aeb12e65a93a64797a890aa0f5f4f6c9125989d7948e55b4be01d209c084595`.
- No aparecieron archivos root-owned ni quedaron contenedores temporales;
  el puerto 4200 quedó libre.

#### Observaciones y limitaciones
- `/tmp` quedó montado con `noexec` en esta validación. No se presenta como
  comportamiento universal de Docker.
- Los 2 GiB fueron suficientes para este proyecto en las operaciones
  probadas; no garantizan suficiente memoria para crecimientos futuros.
- Los límites son por contenedor y se ejecutaron de forma secuencial.
- El montaje `app/frontend` sigue siendo `rw`; `--read-only` no protege ese
  montaje.
- Docker rootful, sin rootless ni userns, mantiene riesgo residual.
- Instalación y servidor conservan red; los scripts de dependencias podrían
  ejecutar código.
- Estas medidas son compensatorias y **no corrigen las CVE** de IMP-003.
- No se repitió validación visual con el perfil endurecido; solo se comprobó
  HTTP. La validación visual de IMP-004 corresponde a aquella ejecución y se
  conserva separada.

#### Documentación
- Documentos actualizados: `README.md`, `MEMORIA.md`, `BITACORA.md`,
  `app/frontend/README.md`, `docs/pruebas.md` y `docs/arquitectura.md`.
- El resumen reproducible queda en este registro; no se depende únicamente de
  la ruta temporal de evidencias.

#### Pendientes o revisión
- IMP-003 sigue abierta; revisar la cadena antes de una entrega o despliegue.
- Revaluar límites si el proyecto crece o si aparecen fallos de recursos.
- Rootless/userns requeriría cambios de daemon fuera de esta autorización.
- Backend, NGINX, Terraform, Dockerfiles y Compose no se han iniciado.

#### Próximo paso
- Usar el perfil documentado y mantener la deuda de seguridad en seguimiento.

### IMP-006 — Base de API Express y contrato inicial

- Inicio: 2026-11-05
- Última actualización: 2026-11-05
- Área: Backend
- Estado: COMPLETADA
- Requerimientos relacionados: arquitectura §5 y §7; backend AGENTS; pruebas PF-02 y PF-23.

#### Cambios realizados
- Se creó la base del backend con Node.js 24, Express 5.3.0, TypeScript 5.9.3
  estricto y módulos ES.
- Se separó la creación de la app (`createApp`) del arranque (`server.ts`).
- Se implementó `GET /api/info` con `environment`, `apiVersion: "v1"`,
  `appVersion` desde `APP_VERSION` e `instanceId` desde el hostname.
- Se añadieron respuestas JSON 404 para rutas desconocidas, límite JSON de
  16 KiB y manejo seguro de JSON malformado, cuerpo demasiado grande y errores
  internos.
- Se implementó configuración validada al arrancar y cierre ordenado ante
  SIGTERM con espera acotada.
- No se implementaron PostgreSQL, `/api/health`, Registros, frontend, NGINX,
  Dockerfiles, Compose ni Terraform.
- No se ejecutó `npm audit fix`, no se usaron overrides y no se modificó el
  frontend.

#### Archivos relevantes
- `app/backend/package.json`
- `app/backend/package-lock.json`
- `app/backend/tsconfig.json`
- `app/backend/tsconfig.test.json`
- `app/backend/vitest.config.ts`
- `app/backend/.env.example`
- `app/backend/.gitignore`
- `app/backend/README.md`
- `app/backend/src/app.ts`
- `app/backend/src/server.ts`
- `app/backend/src/config/env.ts`
- `app/backend/src/api/errors.ts`
- `app/backend/src/middleware/error-handler.ts`
- `app/backend/src/routes/info.routes.ts`
- `app/backend/tests/`

#### Dependencias elegidas
- `express@5.3.0`: framework HTTP aprobado; última versión estable de la
  línea 5.
- `typescript@5.9.3`: compilación estricta ESM.
- `vitest@4.1.12`: runner definido en las pruebas del proyecto; compatible
  con Node 24.
- `supertest@7.3.1` y `@types/supertest@7.2.1`: pruebas HTTP.
- `@types/express@5.0.6` y `@types/node@24.19.2`: tipos de Express 5 y Node 24.
- No se añadieron `pg` ni herramientas de migración.

#### Validaciones
- `npm ci`: exit 0 y reproducible.
- `npm run build`: exit 0; `OOMKilled=false`.
- `npm run typecheck`: exit 0; `OOMKilled=false`.
- `npm test`: 3 archivos y 15 pruebas aprobadas; exit 0;
  `OOMKilled=false`.
- Arranque con configuración inválida: exit 1 y log seguro
  `api failed to start`, sin stack trace.
- `npm audit` y `npm audit --omit=dev`: exit 0; 0 vulnerabilidades.
- Perfil endurecido verificado para este backend en instalación, compilación,
  pruebas y ejecución: usuario no root, `--cap-drop=ALL`,
  `no-new-privileges`, límites por contenedor, `--read-only`, `/tmp` en tmpfs
  y montaje mínimo. En esta ejecución `/tmp` quedó con `noexec`.
- HTTP en red Docker dedicada, sin publicar el backend al host:
  - `/api/info`: 200 JSON con `environment`, `apiVersion`, `appVersion` e
    `instanceId`.
  - Ruta desconocida: 404 `NOT_FOUND` JSON.
  - JSON malformado: 400 `VALIDATION_ERROR`.
  - Cuerpo mayor de 16 KiB: 413 `PAYLOAD_TOO_LARGE`.
  - Sin puertos publicados (`PortBindings={}`).
  - Cierre ante SIGTERM: exit 0 y logs de cierre completo.
- No se observaron OOM, errores de ejecución ni detalles internos en las
  respuestas de error.

#### Documentación
- Documentos actualizados: `README.md`, `app/backend/README.md`,
  `BITACORA.md`, `MEMORIA.md`, `docs/arquitectura.md`,
  `docs/despliegue.md` y `docs/pruebas.md`.
- Se corrigió la contradicción de la respuesta temporal `/api` para que
  `docs/despliegue.md` use JSON `API_NOT_CONFIGURED`, coherente con
  arquitectura y pruebas. NGINX no se implementó.

#### Pendientes o revisión
- Tarea 2: PostgreSQL, migraciones y `/api/health`.
- Tarea 3: Registros.
- Tarea 4: pruebas de integración completas.
- Tarea 5: integración del frontend.
- IMP-003 sigue abierta; no se corrigieron las CVE de `glob`/`minimatch`.

#### Próximo paso
- Planificar e implementar la Tarea 2 con autorización separada.

#### Actualización — Revisión de cierre de Tarea 1 (2026-11-07)

- Revisión documental y de evidencias, sin reimplementar el backend ni repetir
  pruebas ya acreditadas.
- Evidencias conservadas de la Tarea 1: `npm run build` exit 0;
  `npm run typecheck` exit 0; `npm test` con 3 archivos y 15 pruebas;
  `npm ci` exit 0; `npm audit` y `npm audit --omit=dev` con 0 vulnerabilidades;
  HTTP en red Docker dedicada (`/api/info` 200, ruta desconocida 404
  `NOT_FOUND`, JSON malformado 400 `VALIDATION_ERROR`, cuerpo mayor de 16 KiB
  413 `PAYLOAD_TOO_LARGE`); cierre ante SIGTERM con exit 0; configuración
  inválida con exit 1 y log seguro; perfil endurecido validado de forma
  independiente para el backend.
- Verificaciones no repetidas en esta revisión: compilación, pruebas,
  auditoría, HTTP y perfil endurecido. No se reejecutaron.
- Corrección documental: `README.md` actualizado para reflejar que la respuesta
  temporal de `/api` ya está definida como 404 JSON `API_NOT_CONFIGURED` en
  `docs/arquitectura.md` y `docs/despliegue.md`; solo la implementación de
  NGINX sigue pendiente. No se implementó NGINX.
- Plan de Tarea 2 elaborado y pendiente de aprobación; no se instalaron
  dependencias, no se crearon contenedores y no se modificó código ni
  configuración.
- `app/backend/` sigue sin registrar en Git; no se ejecutó `git add`, no se
  crearon commits y no se modificó `.gitignore`.

### IMP-007 — PostgreSQL, migraciones, pool y /api/health

- Inicio: 2026-11-07
- Última actualización: 2026-11-07
- Área: Backend / Base de datos
- Estado: COMPLETADA
- Requerimientos relacionados: RF-02 y RF-03 (base de disponibilidad y
  comprobación); arquitectura §5, §7 y §8; backend/database AGENTS; PF-03 y
  PF-04 (no marcadas como aprobadas).

#### Cambios realizados
- Se añadió `pg@8.23.1` como dependencia de runtime.
- Se añadieron `@types/pg@8.23.1` y `node-pg-migrate@9.0.0` como dependencias
  de desarrollo/migración. El runtime no requiere `node-pg-migrate`.
- La configuración exige `DB_*` al arrancar y valida `DB_PORT`; la conectividad
  no es requisito para arrancar.
- `MIGRATION_DATABASE_URL` se usa exclusivamente en la migración
  administrativa; la API no la recibe.
- Se implementó un pool PostgreSQL con límites de conexión y consulta, logs
  seguros y cierre ordenado ante SIGTERM.
- Se implementó `GET /api/health` con `SELECT 1` real y contrato 200/503.
- Se creó la migración SQL de `records` con restricciones e índice.
- Se creó un script administrativo idempotente de privilegios.
- No se implementaron Registros, integración frontend, NGINX, Dockerfiles,
  Compose ni Terraform.

#### Archivos relevantes
- `app/backend/package.json`
- `app/backend/package-lock.json`
- `app/backend/.env.example`
- `app/backend/src/config/env.ts`
- `app/backend/src/db/pool.ts`
- `app/backend/src/services/health.service.ts`
- `app/backend/src/routes/health.routes.ts`
- `app/backend/src/app.ts`
- `app/backend/src/server.ts`
- `app/backend/tests/`
- `app/database/migrations/1794009600000_create-records.sql`
- `app/database/scripts/grant-app-privileges.sql`
- `README.md`, `app/backend/README.md`, `docs/arquitectura.md`,
  `docs/despliegue.md`, `docs/pruebas.md`, `MEMORIA.md`

#### Validaciones
- `npm ci`: exit 0.
- `npm run build`: exit 0.
- `npm run typecheck`: exit 0.
- `npm test`: 5 archivos y 32 pruebas aprobadas; se conservaron las pruebas de
  Tarea 1.
- `npm audit`: exit 1 por 3 vulnerabilidades moderadas de desarrollo
  (`node-pg-migrate`, `glob@13.0.7` y `minimatch@10.2.6`).
- `npm audit --omit=dev`: exit 0, 0 vulnerabilidades en el alcance auditado.
  No corrige las CVE ni sustituye la auditoría completa.
- PostgreSQL real descartable:
  - Imagen `postgres:17.11-bookworm` con digest
    `sha256:665dc7b37ac52a17e298511414c21d23ffa4e6a6ef6225b3e5d59c7afb35e994`.
  - Usuario efectivo `postgres` (uid 999); sin forzar uid 1000, sin
    `--read-only` ni `--cap-drop`.
  - Límites: 1 CPU, 1 GiB, MemorySwap 1 GiB y 256 PIDs.
  - Sin puertos publicados; red y volumen dedicados.
- Migración sobre base vacía: aplicada.
- Segunda ejecución: `No migrations to run!`; historial con una fila.
- Esquema verificado: columnas, restricciones, índice y propietario
  administrador.
- Privilegios permitidos: `SELECT 1`, `INSERT`, `SELECT` y `DELETE`.
- Privilegios denegados: `UPDATE`, `CREATE TABLE`, `ALTER TABLE`,
  `DROP TABLE` y `TRUNCATE`.
- Privilegios efectivos: `CONNECT` y `USAGE` en `public`; sin `CREATE` en
  `public`; `SELECT`, `INSERT` y `DELETE` sobre `records`; sin `UPDATE`,
  `TRUNCATE`, `REFERENCES` ni `TRIGGER`.
- El rol de aplicación no es propietario, no es superusuario ni miembro del rol
  administrador.
- `/api/health` con BD disponible: 200, `database=up`, 53 ms observados.
- `/api/health` con BD detenida: 503, `database=down`; 10 consultas entre 1004
  y 1123 ms.
- `/api/info` con BD detenida: 200.
- Arranque con configuración válida y BD inaccesible: info 200 y health 503.
- Quince fallos consecutivos devolvieron 503 sin agotar el pool.
- Recuperación tras reiniciar PostgreSQL: 503 (1121 ms), 200 (393 ms) y 200
  (7 ms) sobre el mismo proceso.
- Cierre ante SIGTERM: exit 0 y log `shutdown complete`.
- Respuestas y logs sin secretos, SQL interno ni stack traces.
- Recursos temporales eliminados: contenedores, red, volumen y archivos
  temporales.
- PF-03, PF-04 y PI-* no se marcan aprobadas: no se ejecutó el despliegue
  integrado con NGINX, Terraform ni la interfaz.

#### Documentación
- Documentos actualizados: `README.md`, `app/backend/README.md`,
  `docs/arquitectura.md`, `docs/despliegue.md`, `docs/pruebas.md`,
  `BITACORA.md` y `MEMORIA.md`.
- Se actualizaron las decisiones de timeout, variables de migración,
  separación runtime/migración y privilegios sin `UPDATE`.
- IMP-003 permanece abierta. La deuda de las herramientas de migración del
  backend se registra por separado de la deuda del frontend.

#### Pendientes o revisión
- Tarea 3: Registros.
- Tarea 4: pruebas de integración completas.
- Tarea 5: integración del frontend.
- Creación del rol de aplicación y ejecución de migraciones desde Terraform.
- NGINX, Dockerfiles y despliegue final.

#### Próximo paso
- Planificar e implementar la Tarea 3 (Registros) con autorización separada.

### IMP-008 — Operaciones HTTP de Registros

- Inicio: 2026-11-07
- Última actualización: 2026-11-07
- Área: Backend / API
- Estado: COMPLETADA
- Requerimientos relacionados: RF-04, RF-05, RF-06 y base de RF-07;
  arquitectura §6 y §7; backend AGENTS; PF-06 a PF-18 (validadas solo a nivel
  backend/PostgreSQL, no para el sistema completo).

#### Cambios realizados
- Se implementaron `GET /api/records`, `POST /api/records` y
  `DELETE /api/records/:id`.
- Se separó la funcionalidad en modelo, validación, repositorio, servicio y
  rutas dentro de `src/records/`.
- Se reutilizó el pool existente y SQL parametrizado; no se añadieron ORM ni
  dependencias de runtime.
- El listado usa una sola consulta con `count(*) OVER()` para mantener
  coherencia entre `items` y `total`.
- La creación valida título y descripción, recorta espacios, normaliza
  descripción vacía a `null`, rechaza campos desconocidos y genera `id` con
  `randomUUID()`. `createdAt` procede del registro insertado en PostgreSQL.
- La eliminación valida UUID canónico y usa el resultado real del `DELETE`, sin
  `SELECT` previo.
- Las longitudes se cuentan en puntos de código Unicode, equivalentes a
  `char_length` y `VARCHAR(n)` de PostgreSQL.
- Se añadieron los códigos `RECORD_NOT_FOUND` y `DATABASE_UNAVAILABLE` y el
  mapeo seguro de errores de BD.
- No se modificaron frontend, NGINX, Terraform, Dockerfiles ni Compose.

#### Archivos relevantes
- `app/backend/src/records/records.model.ts`
- `app/backend/src/records/records.validation.ts`
- `app/backend/src/records/records.repository.ts`
- `app/backend/src/records/records.service.ts`
- `app/backend/src/records/records.routes.ts`
- `app/backend/src/api/errors.ts`
- `app/backend/src/middleware/error-handler.ts`
- `app/backend/src/app.ts`
- `app/backend/src/server.ts`
- `app/backend/tests/records.validation.spec.ts`
- `app/backend/tests/records.service.spec.ts`
- `app/backend/tests/records.repository.spec.ts`
- `app/backend/tests/records.routes.spec.ts`
- `app/backend/tests/records.integration.spec.ts`
- `app/backend/tests/test-config.ts`
- `app/backend/tests/health.spec.ts`, `info.spec.ts`, `errors.spec.ts`
- `README.md`, `app/backend/README.md`, `docs/arquitectura.md`,
  `docs/pruebas.md`, `BITACORA.md`, `MEMORIA.md`

#### Validaciones
- `npm ci`: exit 0.
- `npm run build`: exit 0.
- `npm run typecheck`: exit 0.
- `npm test` sin integración: 106 pruebas unitarias aprobadas y 14 de
  integración omitidas.
- `npm test` con `RUN_DB_INTEGRATION=1`: 10 archivos y 120 pruebas aprobadas.
- Integración real verificada: listado vacío; creación y consulta; variantes de
  descripción; recorte; límites 100/500; Unicode (100/101 emoji y mezcla
  99 ASCII + 1 emoji); tipos incorrectos; campos desconocidos; `id`/`createdAt`
  de cliente; cuerpos no objeto; caracteres NUL; títulos repetidos; orden con empate de
  `created_at`; `total` coherente; eliminación 204 sin cuerpo; segunda
  eliminación 404; UUID inválido 400; UUID inexistente 404; texto con
  apariencia SQL tratado como dato; BD no disponible 503 sin detalles;
  recuperación posterior.
- HTTP real: listado vacío 200; creación 201; listado 200; eliminación 204;
  repetición 404 `RECORD_NOT_FOUND`; UUID inválido 400; `id` de cliente 400;
  título de 101 caracteres 400; 100 emoji aceptados.
- BD detenida: `/api/records` 503 `DATABASE_UNAVAILABLE` en 1008–1084 ms;
  recuperación con 503 seguido de 200 en 48 ms y 6 ms sobre el mismo proceso.
  `/api/health` también pasó de 503 a 200.
- Privilegios del rol de aplicación: `SELECT`, `INSERT` y `DELETE` permitidos;
  `UPDATE`, `TRUNCATE` y `CREATE` en `public` denegados.
- Cierre ante SIGTERM: exit 0.
- `npm audit`: exit 1 por 3 vulnerabilidades moderadas de desarrollo
  (`node-pg-migrate`, `glob`, `minimatch`).
- `npm audit --omit=dev`: exit 0, 0 vulnerabilidades en el alcance auditado.
  No corrige las CVE ni sustituye la auditoría completa.
- Sin secretos en respuestas, logs ni archivos del repositorio.
- Recursos temporales eliminados: contenedores, red, volumen y archivos
  temporales.

#### Documentación
- Documentos actualizados: `README.md`, `app/backend/README.md`,
  `docs/arquitectura.md`, `docs/pruebas.md`, `BITACORA.md` y `MEMORIA.md`.
- Se documentaron el contrato, el conteo Unicode, el mapeo de errores de BD y
  la ejecución de las pruebas de integración.
- IMP-003 permanece abierta; la deuda de auditoría no cambió.
- No se marcaron pruebas funcionales del sistema completo como aprobadas.

#### Pendientes o revisión
- Tarea 4: completar las pruebas de integración del sistema.
- Tarea 5: integración del frontend.
- Integración de roles y migraciones con Terraform.
- NGINX, Dockerfiles y despliegue final.

#### Próximo paso
- Planificar e implementar la Tarea 4 (pruebas de integración completas) con
  autorización separada.

### IMP-009 — Integración del frontend con la API real

- Inicio: 2026-11-07
- Última actualización: 2026-11-07
- Área: Frontend / Integración
- Estado: IMPLEMENTADA_PENDIENTE_VALIDACION
- Requerimientos relacionados: RF-01 a RF-07 en su parte de interfaz;
  arquitectura §4 y §7; pruebas PF-01 a PF-24 (solo partes ejecutadas).

#### Cambios realizados
- Se configuró `provideHttpClient(withFetch())` y un proxy de desarrollo
  `/api/**` hacia `http://api:3000`, conservando el prefijo y sin reenviar
  `/api-docs`.
- Estado consume `/api/info` y `/api/health` de forma independiente, valida
  los contratos en runtime y distingue API/PostgreSQL disponibles, BD no
  disponible, API no disponible y respuestas inesperadas.
- Registros implementa formulario reactivo, listado, creación, eliminación con
  confirmación `MatDialog`, validación en puntos de código Unicode, errores por
  campo y estados de carga, vacío, error y datos desactualizados.
- Las mutaciones no se reintentan automáticamente. Un timeout, red, 5xx o
  respuesta inválida se presenta como resultado no confirmado. Un 400/404 se
  trata como fallo confirmado. Si la mutación se confirma y falla la recarga,
  se informa “Operación completada; no se pudo actualizar el listado”.
- Se añadió generación determinista de la versión de interfaz desde
  `package.json`, hooks `prestart`/`prebuild`/`pretest` y versión `0.1.0`.
- Se añadió el guard destructivo de pruebas y se modificó únicamente la suite
  de integración del backend para ejecutarlo antes de cualquier `DELETE`.

#### Archivos relevantes
- `app/frontend/proxy.conf.json`
- `app/frontend/scripts/generate-frontend-version.mjs`
- `app/frontend/angular.json`
- `app/frontend/package.json`, `app/frontend/package-lock.json`
- `app/frontend/.gitignore`
- `app/frontend/src/app/app.config.ts`
- `app/frontend/src/app/core/`
- `app/frontend/src/app/features/status/`
- `app/frontend/src/app/features/records/`
- `app/backend/tests/destructive-db-guard.ts`
- `app/backend/tests/destructive-db-guard.spec.ts`
- `app/backend/tests/records.integration.spec.ts`
- `README.md`, `app/frontend/README.md`, `app/backend/README.md`,
  `docs/arquitectura.md`, `docs/pruebas.md`, `MEMORIA.md`

#### Validaciones
- Frontend: `npm ci` exit 0; `npm run build` exit 0 con advertencia de
  presupuesto inicial (528.53 kB frente a aviso de 500 kB, por debajo del error
  de 1 MB); `npm test -- --watch=false` con 14 archivos y 60 pruebas.
- Backend: `npm ci`, build y typecheck exit 0; 116 pruebas unitarias.
- Integración backend con PostgreSQL real y guard: 11 archivos y 130 pruebas.
- Guard negativo con `TEST_DB_CONFIRM` incorrecto: la suite falló con el
  mensaje esperado antes de cualquier limpieza.
- Marcador `test_guard.marker` creado por el setup administrativo; la
  aplicación solo tiene `SELECT`.
- HTTP por proxy: info, health y records correctos; `/api-docs` devolvió HTML
  de Angular, no JSON de la API; CRUD completo correcto.
- BD detenida: health 503 válido (1.016 s), info 200 (0.008 s) y records 503
  (1.013 s); recuperación a 200.
- API detenida: el proxy devolvió 500 `text/plain` sin health válido
  (7.7–8.0 s); no se interpretó como PostgreSQL caído. Recuperación a 200.
- Perfiles: web 4 CPU/4 GiB (compilación), API 2 CPU/2 GiB, PostgreSQL
  1 CPU/1 GiB; solo web publicó `127.0.0.1:4200`; API y PostgreSQL sin puertos.
- Auditorías: frontend 16 moderadas de desarrollo, 0 con `--omit=dev`;
  backend 3 moderadas de desarrollo, 0 con `--omit=dev`.
- Recursos temporales eliminados tras la validación automática.
- Validación visual, teclado, foco y responsive: pendiente en navegador real.
  No se afirma que se haya ejecutado.

#### Documentación
- Documentos actualizados: `README.md`, `app/frontend/README.md`,
  `app/backend/README.md`, `docs/arquitectura.md`, `docs/pruebas.md`,
  `BITACORA.md` y `MEMORIA.md`.
- Se documentaron proxy, generación de versión, guard destructivo y
  clasificación de estados/mutaciones.
- IMP-003 permanece abierta.
- No se marcaron pruebas del sistema completo como aprobadas.

#### Pendientes o revisión
- Validación manual en navegador de la integración actual.
- Completar pruebas del sistema completo cuando existan NGINX y Terraform.
- Integración de roles y migraciones con Terraform.
- NGINX, Dockerfiles y despliegue final.

#### Próximo paso
- Ejecutar la validación manual de IMP-009; después avanzar con NGINX,
  Dockerfiles y Terraform, sin reabrir tareas completadas.

<!--
Plantilla para cada implementación:

### IMP-001 — Título breve

- Inicio:
- Última actualización:
- Área:
- Estado:
- Requerimientos relacionados:

#### Cambios realizados
- ...

#### Archivos relevantes
- ...

#### Validaciones
- Comando o comprobación:
- Resultado real:
- Verificaciones no ejecutadas y motivo:

#### Documentación
- Documentos actualizados:
- README: actualizado / revisado sin cambios.
- Memoria: actualizada.

#### Pendientes o revisión
- Ninguno, o descripción concreta.

#### Próximo paso
- ...

Al retomar la misma implementación, actualizar su entrada.
Crear otra entrada si se trata de una implementación distinta.
-->