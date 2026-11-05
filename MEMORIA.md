# Memoria del proyecto

## Estado actual
- Fase: primera estructura visual implementada y validada manualmente por el
  usuario; integración de datos pendiente.
- `app/frontend/` contiene un workspace Angular 21 con standalone, routing,
  SCSS, TypeScript estricto, modo zoneless y sin SSR.
- Angular Material y CDK `21.2.14` instalados; shell con navegación lateral,
  rutas `/estado` y `/registros`, redirección desde `/` y página 404.
- Estado y Registros muestran solo estructuras y mensajes neutrales; no hay
  llamadas a `/api`, datos simulados ni métricas ficticias.
- `package-lock.json` regenerado con Material/CDK; `AGENTS.md` intacto.
- Pruebas unitarias: 5 archivos y 9 pruebas aprobadas.
- Servidor de desarrollo verificado por HTTP; publicación solo en
  `127.0.0.1:4200`.
- Validación manual del usuario (2026-11-05): Estado, redirección, navegación,
  acceso y recarga de `/registros`, 404, consola sin errores de la aplicación
  observados, red sin solicitudes a `/api`, sin recursos externos, vista de
  360 px, cambio 959/960 px, menú móvil, teclado, foco visible y enlace de
  salto. No fue ejecutada ni automatizada por el agente; no se tomaron
  capturas. No cubre NGINX, Terraform ni el despliegue final.
- Backend, base de datos, Dockerfiles, NGINX y Terraform siguen sin implementar.

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

## Versiones fijadas
- Node.js 24.13.1 en contenedor:
  `node:24.13.1-bookworm-slim@sha256:a81a03dd965b4052269a57fac857004022b522a4bf06e7a739e25e18bce45af2`.
- Angular CLI 21.2.29 y `@angular/build` 21.2.29.
- Angular 21.2.26, Material 21.2.14, CDK 21.2.14 y TypeScript 5.9.3
  resueltos por `package-lock.json`.

## Trabajo activo
- IMP-001: inicialización y compilación base Angular 21. COMPLETADA.
- IMP-002: verificación de pruebas y arranque del frontend. COMPLETADA.
- IMP-003: deuda de seguridad npm (`glob` y `minimatch`). REQUIERE_REVISION.
- IMP-004: primera estructura visual del panel. COMPLETADA.

## Pendientes y advertencias
- Integración API, comprobaciones reales de servicios, formularios y listados:
  pendientes.
- Deuda de seguridad npm sin corregir: 16 alertas moderadas (`glob@13.0.6`
  y `minimatch@10.2.6`) vía `@angular/cli@21.2.29 → pacote@21.5.1`; detalle
  en `BITACORA.md` (IMP-003). No silenciar `npm audit`.
- No ejecutar `npm audit fix`, overrides ni degradaciones de Angular CLI.
- `npm audit --omit=dev` dio 0 en el alcance auditado sin dependencias de
  desarrollo; no inspecciona el bundle generado ni demuestra por sí solo la
  ausencia de esos paquetes en el bundle.
- Docker es mitigación parcial: las herramientas siguen ejecutándose y el
  montaje de `app/frontend` permite modificar archivos del host. Mantener
  montajes mínimos, sin credenciales ni socket de Docker.
- Responsable de seguimiento: mantenedor del proyecto. Revisar la cadena
  antes de una entrega o despliegue; verificar versiones transitivas y repetir
  auditoría, compilación y pruebas.
- Contradicción pendiente para NGINX: `docs/arquitectura.md` (§10) define
  `/api` como 404 JSON y `docs/despliegue.md` (§4) como 404 en texto plano.
- No ejecutar despliegues, migraciones sobre datos existentes ni destrucciones
  sin la autorización correspondiente.

## Siguiente paso
1. Planificar formularios y listados sin iniciar su implementación.
2. Integrar la API y ejecutar comprobaciones reales de servicios.
3. Definir la respuesta temporal de `/api` para NGINX.

## Última actualización
- Fecha: 2026-11-05.
- Implementación relacionada: IMP-004.
