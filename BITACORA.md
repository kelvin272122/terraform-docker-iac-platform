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
  modificó ninguna de las dos versiones.

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