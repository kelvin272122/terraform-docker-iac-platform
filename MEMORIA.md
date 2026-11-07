# Memoria del proyecto

## Estado actual
- Fase: frontend integrado con la API y PostgreSQL, validado con Playwright en
  navegador real; backend con Registros, migraciones y health; NGINX/Terraform
  por implementar.
- `app/frontend/` contiene un workspace Angular 21 con standalone, routing,
  SCSS, TypeScript estricto, modo zoneless y sin SSR.
- Angular Material y CDK `21.2.14` instalados; shell con navegación lateral,
  rutas `/estado` y `/registros`, redirección desde `/` y página 404.
- Estado y Registros consumen la API real mediante rutas relativas y proxy de
  desarrollo `/api/**`; no hay datos simulados ni activación de simulación ante
  fallos. La versión de interfaz se genera desde `package.json` (0.1.0).
- `app/backend/` contiene Express 5 con `GET /api/info`, `GET /api/health`,
  `GET/POST/DELETE /api/records`, pool PostgreSQL, configuración `DB_*`,
  migraciones SQL, 404 JSON, límite JSON de 16 KiB, errores seguros y cierre
  ante SIGTERM.
- Validación visual, teclado, foco y responsive de la integración actual:
  pendiente en navegador real. NGINX, Dockerfiles y Terraform siguen
  pendientes.
- `package-lock.json` del frontend regenerado con Material/CDK; `AGENTS.md`
  intacto.
- Pruebas frontend: 14 archivos y 62 pruebas aprobadas.
- Pruebas backend: 11 archivos y 130 pruebas aprobadas (116 unitarias y 14 de
  integración con PostgreSQL real descartable y guard destructivo).
- Auditoría backend completa: 3 alertas moderadas de desarrollo/migración;
  `npm audit --omit=dev` con 0 en el alcance auditado.
- Auditoría frontend: 16 alertas moderadas de desarrollo; `npm audit
  --omit=dev` con 0 en el alcance auditado.
- Servidor de desarrollo frontend verificado por HTTP; publicación solo en
  `127.0.0.1:4200`.
- Perfil de desarrollo endurecido validado en IMP-005: usuario no root,
  `--cap-drop=ALL`, `no-new-privileges`, límites por contenedor, `--read-only`
  y `/tmp` en tmpfs. No corrige las CVE de IMP-003.
- Validación manual del usuario (2026-11-05): Estado, redirección, navegación,
  acceso y recarga de `/registros`, 404, consola sin errores de la aplicación
  observados, red sin solicitudes a `/api`, sin recursos externos, vista de
  360 px, cambio 959/960 px, menú móvil, teclado, foco visible y enlace de
  salto. No fue ejecutada ni automatizada por el agente; no se tomaron
  capturas. No cubre NGINX, Terraform ni el despliegue final.

## Decisiones aprobadas
- Aplicación: Panel de verificación IaC.
- Objetivo principal: demostrar infraestructura local con Terraform y Docker.
- Interfaz: dashboard serio y minimalista, con logo y dos secciones:
  estado del despliegue y registros de demostración.
- Acceso local sin autenticación ni roles.
- Frontend Angular; backend Node.js y Express; PostgreSQL; NGINX.
- Entornos dev y prod con estados y recursos separados.
- Construcción de imágenes previa al despliegue.
- Migraciones versionadas.
- Destrucción completa del entorno incluye su volumen y datos,
  únicamente con autorización.
- Paleta clara aprobada para esta tarea, tipografía del sistema, logo SVG
  local, navegación «Estado»/«Registros» y breakpoint explícito de 960 px.
- Perfil endurecido para los comandos de desarrollo, validado en IMP-005:
  2 CPU/2 GiB para instalación, pruebas y servidor; 4 CPU/4 GiB para
  compilación; 512 PIDs; swap igual a memoria; `--read-only` con `/tmp`
  temporal.

## Versiones fijadas
- Node.js 24.13.1 en contenedor:
  `node:24.13.1-bookworm-slim@sha256:a81a03dd965b4052269a57fac857004022b522a4bf06e7a739e25e18bce45af2`.
- Angular CLI 21.2.29 y `@angular/build` 21.2.29.
- Angular 21.2.26, Material 21.2.14, CDK 21.2.14 y TypeScript 5.9.3
  resueltos por `package-lock.json`.
- Backend: Express 5.3.0, pg 8.23.1, TypeScript 5.9.3, Vitest 4.1.12 y
  Supertest 7.3.1.
- Migración: node-pg-migrate 9.0.0 y @types/pg 8.23.1 (desarrollo/migración).
- PostgreSQL 17.11 mediante
  `postgres:17.11-bookworm@sha256:665dc7b37ac52a17e298511414c21d23ffa4e6a6ef6225b3e5d59c7afb35e994`.

## Trabajo activo
- IMP-001: inicialización y compilación base Angular 21. COMPLETADA.
- IMP-002: verificación de pruebas y arranque del frontend. COMPLETADA.
- IMP-003: deuda de seguridad npm (`glob` y `minimatch`). REQUIERE_REVISION.
- IMP-004: primera estructura visual del panel. COMPLETADA.
- IMP-005: endurecimiento del entorno de desarrollo. COMPLETADA.
- IMP-006: base de API Express y contrato inicial. COMPLETADA.
- IMP-007: PostgreSQL, migraciones, pool y `/api/health`. COMPLETADA.
- IMP-008: operaciones HTTP de Registros. COMPLETADA.
- IMP-009: integración del frontend con la API real. COMPLETADA.

## Pendientes y advertencias
- Validación de navegador completada con Playwright 1.65.0/Chromium 158:
  foco inicial en Cancelar, Enter, clic en Cancelar, Escape, Tab/Shift+Tab,
  «Saltar al contenido», listado desactualizado con BD detenida, recuperación y
  consola aprobados. La eliminación confirmada produce un DELETE 204 y el foco
  posterior queda en el encabezado `#records-title`.
- Pruebas del sistema completo y despliegue NGINX/Terraform: pendientes.
- Deuda de seguridad de herramientas de migración del backend: 3 alertas
  moderadas (`node-pg-migrate`, `glob@13.0.7` y `minimatch@10.2.6`). El runtime
  no requiere `node-pg-migrate`; `npm audit --omit=dev` da 0 en el alcance
  auditado, lo que no corrige las CVE.
- Deuda de seguridad npm del frontend sin corregir: 16 alertas moderadas
  (`glob@13.0.6` y `minimatch@10.2.6`) vía
  `@angular/cli@21.2.29 → pacote@21.5.1`; detalle en `BITACORA.md` (IMP-003).
  No silenciar `npm audit`.
- No ejecutar `npm audit fix`, overrides ni degradaciones de Angular CLI.
- `npm audit --omit=dev` dio 0 en el alcance auditado sin dependencias de
  desarrollo; no inspecciona el bundle generado ni demuestra por sí solo la
  ausencia de esos paquetes en el bundle.
- Docker es mitigación parcial: las herramientas siguen ejecutándose y el
  montaje de `app/frontend` permite modificar archivos del host. Mantener
  montajes mínimos, sin credenciales ni socket de Docker.
- Los límites del perfil endurecido son por contenedor. `app/frontend` sigue
  en `rw`; Docker sigue en modo rootful. En la validación de IMP-005 `/tmp`
  quedó con `noexec`; no es un comportamiento universal de Docker.
- La validación del perfil endurecido fue por comandos y HTTP, no visual. La
  validación visual de IMP-004 se conserva separada.
- Evidencias de IMP-009:
  - `docs/Evidencias/IMP-009/2026-11-07-browser/`
  - `docs/Evidencias/IMP-009/2026-11-07-revalidacion-1/`
  - `docs/Evidencias/IMP-009/2026-11-07-revalidacion-2/`
- Imagen Playwright `v1.65.0-noble` conservada por digest (3.65 GB).
- `ng test` y `ng serve` compilan la aplicación: se usó el perfil 4 CPU/4 GiB.
  Con 2 GiB `ng test` fue terminado (exit 137). La instalación conserva 2 CPU/2
  GiB.
- Responsable de seguimiento: mantenedor del proyecto. Revisar la cadena
  antes de una entrega o despliegue; verificar versiones transitivas y repetir
  auditoría, compilación y pruebas.
- Respuesta temporal de `/api` sin backend: decisión unificada como 404 JSON
  `API_NOT_CONFIGURED`; la implementación NGINX sigue pendiente.
- No ejecutar despliegues, migraciones sobre datos existentes ni destrucciones
  sin la autorización correspondiente.

## Siguiente paso
1. Implementar NGINX y Dockerfiles con autorización.
2. Integrar Terraform, roles y migraciones.
3. Completar las pruebas del sistema completo.

## Última actualización
- Fecha: 2026-11-07.
- Implementación relacionada: IMP-009 (integración del frontend, corrección de
  foco y revalidación en navegador).
