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
| IMP-003 | Deuda de seguridad npm: glob y minimatch | Frontend | REQUIERE_REVISION | 2026-11-04 |

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
- Última actualización: 2026-11-04
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