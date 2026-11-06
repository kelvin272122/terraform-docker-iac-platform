# Pruebas — Panel de verificación IaC

## 1. Estado

Plan de pruebas aprobado para implementación.
Todas las pruebas comienzan como NO EJECUTADA.
No existen resultados reales hasta registrar una ejecución.

## 2. Herramientas

- Frontend: Vitest y herramientas de pruebas Angular.
- Backend: Vitest y Supertest.
- Flujos completos: Playwright.
- Smoke: Bash y cliente HTTP.
- Infraestructura: Terraform CLI y Docker CLI.
- Pruebas integradas de API contra PostgreSQL real de entorno de prueba.
- Simulaciones solo en pruebas unitarias o desarrollo declarado.

## 3. Comandos que deberá exponer la implementación

Frontend y backend:
- npm ci
- npm run build
- npm test -- --watch=false (frontend; ejecución única sin watch)

Frontend:
- npm run test:e2e

Backend:
- npm run db:migrate

Infraestructura:
- terraform fmt -check -recursive
- terraform init
- terraform validate

Los comandos deben implementarse y comprobarse antes de declararlos operativos.

### Validación del perfil endurecido de desarrollo (2026-11-05)

- Ejecutada con contenedores temporales, usuario no root, `--cap-drop=ALL`,
  `no-new-privileges`, límites de CPU/memoria/PIDs, `--read-only` y `/tmp`
  en tmpfs.
- Resultados: `npm ci` exit 0; `npm run build` exit 0; `npm test --
  --watch=false` con 5 archivos y 9 pruebas; servidor con HTTP 200 en `/`,
  `/estado`, `/registros`, ruta desconocida y `/logo.svg`.
- Controles comprobados: `CapEff=0`, `NoNewPrivs=1`, raíz de solo lectura,
  `memory.max` y `pids.max` efectivos, publicación solo en `127.0.0.1:4200`.
- En esta validación `/tmp` quedó con `noexec`; no se asume como
  comportamiento universal de Docker.
- No se repitió validación visual; la validación visual de IMP-004 es
  independiente. Estas medidas no corrigen las alertas de IMP-003.

## 4. Matriz funcional

| ID | Prueba | Resultado esperado |
|---|---|---|
| PF-01 | Abrir raíz | Redirección a /estado |
| PF-02 | Consultar info | Entorno y versiones correctos |
| PF-03 | API y BD disponibles | Salud 200, ambos up |
| PF-04 | BD detenida | Salud 503, API up y BD down |
| PF-05 | API detenida | API no disponible y BD desconocida |
| PF-06 | Crear registro válido | 201 y dato visible |
| PF-07 | Título vacío/espacios | 400 y sin inserción |
| PF-08 | Límites de campos | Acepta 100/500; rechaza excesos |
| PF-09 | Descripción vacía | Persistida como null |
| PF-10 | Doble clic al guardar | Un único envío mientras está pendiente |
| PF-11 | Error de creación | Formulario conservado |
| PF-12 | Listado vacío | Mensaje vacío, total 0 |
| PF-13 | Orden de registros | Más recientes primero |
| PF-14 | Cancelar eliminación | No se envía DELETE |
| PF-15 | Confirmar eliminación | 204 y registro retirado |
| PF-16 | UUID inválido | 400 controlado |
| PF-17 | UUID inexistente | 404 controlado |
| PF-18 | Fallo de BD en CRUD | 503, sin detalles privados |
| PF-19 | Carga y errores | Estados visibles y comprensibles |
| PF-20 | Móvil 360 px/escritorio | Interfaz usable sin overflow general |
| PF-21 | Teclado | Navegación, foco y confirmaciones operables |
| PF-22 | Recargar /registros | NGINX entrega SPA correctamente |
| PF-23 | Ruta API inexistente | 404 JSON, no HTML |
| PF-24 | Simulación desactivada | Demo usa backend y BD reales |

### Validación manual de la interfaz inicial (2026-11-05)

- Ejecutada manualmente por el usuario en un navegador real; no fue
  automatizada ni ejecutada por el agente.
- Aprobadas: renderizado de Estado; redirección `/` → `/estado`; navegación
  Estado/Registros; acceso directo y recarga de `/registros`; página 404 y
  enlace de regreso; consola sin errores de la aplicación observados; red sin
  solicitudes a `/api`; ausencia de recursos externos de la aplicación; vista
  de 360 px; cambio entre 959 y 960 px; apertura y cierre del menú móvil;
  navegación por teclado, foco visible y enlace «Saltar al contenido».
- Incidencias: ninguna. Capturas: no se tomaron.
- Alcance: interfaz y servidor de desarrollo. No verifica NGINX, Terraform, el
  despliegue final ni la integración con la API.

## 5. Matriz de infraestructura

| ID | Prueba | Resultado esperado |
|---|---|---|
| PI-01 | Formato y validación | Sin errores |
| PI-02 | Despliegue desde prerrequisitos | Recursos y aplicación operativos |
| PI-03 | Reaplicar migraciones | Sin duplicación ni pérdida |
| PI-04 | Plan posterior estable | Sin cambios inesperados |
| PI-05 | Recrear API | Servicio vuelve; datos conservados |
| PI-06 | Recrear BD manteniendo volumen | Registro testigo conservado |
| PI-07 | Inspeccionar puertos | Solo NGINX publicado en loopback |
| PI-08 | Inspeccionar redes | Membresías acordadas y BD aislada de frontend_net |
| PI-09 | Ejecutar dev y prod | Puertos, recursos y datos separados |
| PI-10 | Variables/workspace discordantes | Despliegue bloqueado |
| PI-11 | Cambiar puerto de prueba | Plan muestra efecto y app accesible |
| PI-12 | Eliminar API manualmente | Plan detecta recurso ausente |
| PI-13 | Aplicar recuperación | API recreada y salud correcta |
| PI-14 | Destruir dev | Recursos dev eliminados y prod intacto |
| PI-15 | Recrear tras destrucción total | Base vacía y esquema reconstruido |
| PI-16 | Privilegios API | CRUD permitido; DDL administrativo denegado |
| PI-17 | Revisar secretos | Sin secretos en Git, UI ni evidencias |
| PI-18 | Defensa desconectada | Operaciones previstas sin descargas nuevas |
| PI-19 | Nueva versión de imagen | Contenedor usa build nuevo y versión correcta |

Las pruebas destructivas se ejecutan únicamente en dev.
Guardar el registro testigo antes de las pruebas de persistencia.
Restaurar configuración y verificar un plan estable después de cambios.

## 6. Evidencias

Por ejecución:
- ID de prueba.
- Fecha y entorno.
- Versión del código e imágenes.
- Precondiciones.
- Comandos o acciones.
- Resultado esperado.
- Resultado obtenido.
- Estado: NO EJECUTADA, APROBADA, FALLIDA o BLOQUEADA.
- Ruta de evidencia sanitizada.
- Observaciones.

Ubicación:
- docs/evidencias/aplicacion/
- docs/evidencias/infraestructura/
- docs/evidencias/pruebas/

No guardar estados, contraseñas, tokens ni dumps.
Las capturas complementan resultados; no sustituyen pasos reproducibles.

## 7. Puerta de salida

No presentar como terminado hasta:
- Compilaciones y pruebas automatizadas correctas.
- Pruebas funcionales obligatorias aprobadas.
- Pruebas de infraestructura obligatorias aprobadas.
- Fallos corregidos o limitaciones explícitamente aceptadas.
- Evidencias revisadas.
- Documentación coherente con la implementación.

### Verificación de la etapa inicial sin backend

- /api y /api/records responden 404 con Content-Type application/json.
- El cuerpo identifica explícitamente que la API no está configurada.
- Ninguna de estas rutas devuelve el HTML de Angular.

Esta comprobación aplica únicamente antes de integrar el backend.
No sustituye las pruebas del contrato API final.