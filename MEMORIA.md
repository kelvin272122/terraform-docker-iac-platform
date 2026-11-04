# Memoria del proyecto

## Estado actual
- Fase: especificación e instrucciones de trabajo.
- El usuario confirma que existen AGENTS.md raíz y docs/AGENTS.md.
- Estado del código e infraestructura: verificar en el repositorio antes de actuar.
- No considerar los árboles propuestos como evidencia de archivos existentes.

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

## Referencias de especificación
- docs/requerimientos.md
- docs/arquitectura.md
- docs/despliegue.md
- docs/pruebas.md
- Consultar el AGENTS.md del área antes de trabajar en ella.

## Trabajo activo
- Implementación: ninguna registrada todavía.
- Objetivo inmediato: verificar y completar los archivos de especificación
  e instrucciones antes de iniciar la construcción.

## Pendientes y advertencias
- Verificar cuáles documentos propuestos ya se guardaron en el repositorio.
- Fijar y registrar versiones exactas al inicializar las herramientas.
- No existen resultados de pruebas confirmados en esta memoria.
- No ejecutar despliegues, migraciones sobre datos existentes ni destrucciones
  sin la autorización correspondiente.

## Siguiente paso
1. Inspeccionar la estructura existente.
2. Comprobar coherencia entre especificaciones.
3. Ejecutar únicamente la implementación solicitada por el usuario.

## Última actualización
- Fecha: completar al actualizar.
- Implementación relacionada: ninguna.