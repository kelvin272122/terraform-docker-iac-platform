# Memoria del proyecto

## Estado actual
- Fase: base del frontend inicializada y verificada.
- `app/frontend/` contiene un workspace Angular 21 compilable, con
  standalone, routing, SCSS, TypeScript estricto, modo zoneless y sin SSR.
- `package-lock.json` generado y conservado; `AGENTS.md` del frontend intacto.
- Pruebas unitarias ejecutadas: 1 archivo y 2 pruebas aprobadas.
- Servidor de desarrollo verificado: escucha en `0.0.0.0:4200` y se publica
  únicamente en `127.0.0.1:4200`; respuesta HTTP 200.
- Renderizado en navegador: verificado manualmente por el usuario en
  `http://localhost:4200/` y `http://127.0.0.1:4200/`; no es una prueba
  automatizada.
- Backend, base de datos, Dockerfiles, NGINX, Angular Material y Terraform
  siguen sin implementar.

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

## Versiones fijadas
- Node.js 24.13.1 en contenedor:
  `node:24.13.1-bookworm-slim@sha256:a81a03dd965b4052269a57fac857004022b522a4bf06e7a739e25e18bce45af2`.
- Angular CLI 21.2.29.
- Angular 21.2.26 y TypeScript 5.9.3 resueltos por `package-lock.json`.

## Trabajo activo
- IMP-001: inicialización y compilación base Angular 21. COMPLETADA.
- IMP-002: verificación de pruebas y arranque del frontend. COMPLETADA.
- IMP-003: deuda de seguridad npm (`glob` y `minimatch`). REQUIERE_REVISION.

## Pendientes y advertencias
- Consola del navegador: no confirmada libre de errores.
- La validación visual fue manual del usuario; `curl` solo comprobó HTTP y
  HTML inicial.
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
  antes de Angular Material, ante actualizaciones relevantes y antes de una
  entrega o despliegue; verificar versiones transitivas y repetir auditoría,
  compilación y pruebas.
- Contradicción pendiente para NGINX: `docs/arquitectura.md` (§10) define
  `/api` como 404 JSON y `docs/despliegue.md` (§4) como 404 en texto plano.
- No ejecutar despliegues, migraciones sobre datos existentes ni destrucciones
  sin la autorización correspondiente.

## Siguiente paso
1. Continuar el desarrollo local con la deuda de seguridad registrada.
2. Revisar la cadena npm antes de incorporar Angular Material.
3. Incorporar Angular Material y construir la estructura del dashboard.
4. Integrar la API y definir la respuesta temporal de `/api` para NGINX.

## Última actualización
- Fecha: 2026-11-04.
- Implementación relacionada: IMP-003.
