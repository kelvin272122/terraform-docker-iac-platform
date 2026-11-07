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
- npm test (Vitest, ejecución única; no usa argumentos de Angular)
- npm run typecheck
- npm run db:migrate (tarea PostgreSQL)

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

### Validación de la base de API (Tarea 1, 2026-11-05)

- `npm run build`, `npm run typecheck` y `npm test`: exit 0.
- Vitest: 3 archivos y 15 pruebas aprobadas.
- `npm ci` reproducible: exit 0; `npm audit` y `npm audit --omit=dev`: 0
  vulnerabilidades.
- HTTP en red Docker dedicada, sin publicar el backend al host:
  `/api/info` 200; ruta desconocida 404 JSON; JSON malformado 400
  `VALIDATION_ERROR`; cuerpo mayor de 16 KiB 413 `PAYLOAD_TOO_LARGE`.
- El servidor cerró ordenadamente ante SIGTERM con exit 0.
- El arranque con configuración inválida terminó con exit 1 y un log seguro,
  sin stack trace.
- PostgreSQL y los endpoints de salud y registros todavía no están
  implementados en esta tarea.

### Validación de la Tarea 2 con PostgreSQL 17 real (2026-11-07)

- Entorno: Docker 29.9.3; PostgreSQL `17.11-bookworm` con digest
  `sha256:665dc7b37ac52a17e298511414c21d23ffa4e6a6ef6225b3e5d59c7afb35e994`;
  red y volumen dedicados, sin puertos publicados.
- Contenedor PostgreSQL: usuario efectivo `postgres` (uid 999), sin forzar
  uid 1000, sin `--read-only` ni `--cap-drop`; límites 1 CPU, 1 GiB,
  MemorySwap 1 GiB y 256 PIDs.
- API en red dedicada, sin puertos publicados, con el perfil endurecido de
  Node (usuario no root, `--cap-drop=ALL`, `no-new-privileges`, límites,
  `--read-only`, `/tmp` en tmpfs).
- Migración sobre base vacía: aplicada correctamente.
- Segunda ejecución: `No migrations to run!`; historial con una sola fila.
- Esquema verificado: columnas, restricciones `records_title_valid` y
  `records_description_valid`, índice `records_created_at_id_idx`, propietario
  `iac_t2_admin`.
- Rol de aplicación: `SELECT 1`, `INSERT`, `SELECT` y `DELETE` permitidos;
  `UPDATE`, `CREATE TABLE`, `ALTER TABLE`, `DROP TABLE` y `TRUNCATE`
  denegados. Sin superusuario, sin `CREATEDB`, sin `CREATEROLE`, sin
  pertenencia al rol administrador y sin tablas propias.
- Privilegios efectivos: `CONNECT` y `USAGE` en `public`; `CREATE` en
  `public` denegado; `SELECT`, `INSERT` y `DELETE` sobre `records`
  permitidos; `UPDATE`, `TRUNCATE`, `REFERENCES` y `TRIGGER` denegados.
- `GET /api/health` con BD disponible: 200 `status=ok`, `api=up`,
  `database=up`, tiempo observado 53 ms en la primera consulta.
- `GET /api/health` con BD detenida: 503 `status=degraded`, `api=up`,
  `database=down`; 10 consultas consecutivas entre 1004 y 1123 ms.
- `GET /api/info` con BD detenida: 200, sin dependencia de PostgreSQL.
- Arranque con configuración válida y BD inaccesible: `/api/info` 200 y
  `/api/health` 503. Quince fallos consecutivos devolvieron 503 sin agotar el
  pool.
- Recuperación tras reiniciar PostgreSQL: primera consulta 503 (1121 ms),
  segunda 200 (393 ms) y tercera 200 (7 ms) sobre el mismo proceso de API.
- Cierre ante SIGTERM: exit 0 y log `shutdown complete`.
- Respuestas sin contraseñas, SQL interno ni stack traces. Logs sin secretos.
- `npm ci`, `npm run build`, `npm run typecheck` y `npm test`: exit 0;
  5 archivos y 32 pruebas aprobadas.
- `npm audit`: exit 1 por 3 vulnerabilidades moderadas de desarrollo
  (`node-pg-migrate`, `glob`, `minimatch`). `npm audit --omit=dev`: exit 0 con
  0 vulnerabilidades en el alcance auditado. Esto no corrige las CVE ni
  sustituye la auditoría completa.
- Recursos temporales eliminados después de la prueba.
- Esta validación **no marca PF-03, PF-04 ni PI-* como aprobadas**: no se
  ejecutó el despliegue integrado con NGINX, Terraform ni la interfaz.
  Tampoco implementa ni valida las rutas de Registros.

### Validación de la Tarea 3 (Registros) — 2026-11-07

- Entorno: PostgreSQL 17.11 (digest
  `sha256:665dc7b37ac52a17e298511414c21d23ffa4e6a6ef6225b3e5d59c7afb35e994`)
  en red y volumen dedicados, sin puertos publicados; API en red dedicada, sin
  puertos publicados y con el perfil endurecido de Node.
- Rol de aplicación con `SELECT`, `INSERT` y `DELETE`; `UPDATE`, `TRUNCATE` y
  `CREATE` en `public` denegados.
- `npm ci`, `npm run build` y `npm run typecheck`: exit 0.
- `npm test` sin integración: 106 pruebas unitarias aprobadas y 14 de
  integración omitidas.
- `npm test` con `RUN_DB_INTEGRATION=1`: 10 archivos y 120 pruebas aprobadas
  (106 unitarias y 14 de integración).
- Cobertura de integración real:
  - Listado vacío con `items: []` y `total: 0`.
  - Creación y posterior consulta del registro.
  - Descripción omitida, `null`, vacía y con espacios: normalizada a `null`.
  - Descripción con contenido: recortada y conservada.
  - Título con espacios externos: recortado.
  - Límites válidos de 100 y 500 caracteres; rechazo de 101 y 501.
  - Unicode: 100 emoji válidos, 101 rechazados, mezcla de 99 ASCII + 1 emoji
    válida y 500/501 emoji en descripción.
  - Tipos incorrectos, campos desconocidos, `id`/`createdAt` enviados por el
    cliente, cuerpos que no son objetos y caracteres NUL: 400
    `VALIDATION_ERROR`.
  - Títulos repetidos permitidos.
  - Orden estable `created_at DESC, id DESC` con empate de `created_at`.
  - `total` igual al número de elementos devueltos.
  - Eliminación 204 sin cuerpo; segunda eliminación 404 `RECORD_NOT_FOUND`.
  - UUID inválido 400; UUID válido inexistente 404.
  - Texto con apariencia SQL tratado como dato y tabla intacta.
  - BD no disponible: 503 `DATABASE_UNAVAILABLE` sin detalles internos.
  - Recuperación posterior con la base disponible.
- HTTP real sobre la API en contenedor:
  - Listado vacío 200; creación 201; listado 200 con `total` correcto.
  - Eliminación 204 con cuerpo vacío; repetición 404 `RECORD_NOT_FOUND`.
  - UUID inválido 400; UUID inexistente 404; `id` de cliente 400; título de
    101 caracteres 400.
  - Título de 100 emoji aceptado (200 unidades UTF-16, 100 puntos de código).
  - BD detenida: `/api/records` 503 `DATABASE_UNAVAILABLE` en 1008–1084 ms.
  - Recuperación: primera consulta 503 y siguientes 200 en 48 ms y 6 ms sobre
    el mismo proceso.
  - `/api/health` con BD detenida: 503; recuperada: 200.
- Cierre ante SIGTERM: exit 0.
- `npm audit`: exit 1 por 3 vulnerabilidades moderadas de desarrollo
  (`node-pg-migrate`, `glob`, `minimatch`). `npm audit --omit=dev`: exit 0 con
  0 vulnerabilidades en el alcance auditado. No corrige las CVE ni sustituye
  la auditoría completa.
- No se exponen contraseñas, cadenas de conexión, SQL interno ni stack traces.
- Recursos temporales eliminados después de la prueba.
- Esta validación **no marca PF-05 a PF-18 ni PI-* como aprobadas para el
  sistema completo**: cubre backend y PostgreSQL real, sin frontend, NGINX ni
  Terraform.

### Validación de la Tarea 5 (integración frontend) — 2026-11-07

- Entorno integrado temporal: redes frontend y backend interna dedicadas,
  PostgreSQL 17.11, API y Angular dev. Solo Angular publicado en
  `127.0.0.1:4200`; API y PostgreSQL sin puertos publicados.
- Proxy `/api/**` hacia `http://api:3000`: `/api/info`, `/api/health` y
  `/api/records` respondieron correctamente conservando el prefijo.
- `/api-docs` no se reenvió a la API: devolvió el HTML de Angular, no el JSON
  de error de la API.
- CRUD por proxy: creación 201, listado 200, eliminación 204 sin cuerpo y
  listado posterior vacío.
- BD detenida: `/api/health` 503 con cuerpo válido `database=down` (1.016 s),
  `/api/info` 200 (0.008 s) y `/api/records` 503 `DATABASE_UNAVAILABLE`
  (1.013 s). Recuperación: health y records volvieron a 200.
- API detenida: el proxy devolvió 500 `text/plain` sin cuerpo de health válido
  (7.7–8.0 s). No se interpretó como PostgreSQL caído; la BD queda desconocida.
  Recuperación: health y records volvieron a 200.
- Frontend: `npm ci` exit 0; `npm run build` exit 0 con advertencia de
  presupuesto inicial (528.53 kB supera el aviso de 500 kB, por debajo del
  error de 1 MB); `npm test -- --watch=false` con 14 archivos y 60 pruebas
  aprobadas.
- Backend: `npm ci`, `npm run build` y `npm run typecheck` exit 0;
  `npm test` con 116 pruebas unitarias y 14 de integración omitidas.
- Integración backend con PostgreSQL real y guard: 11 archivos y 130 pruebas
  aprobadas.
- Guard destructivo: `RUN_DB_INTEGRATION=1`, `DESTRUCTIVE_DB_TESTS=1`,
  `DB_NAME=iac_test_*`, `TEST_DB_CONFIRM` y `TEST_DB_MARKER_TOKEN`. El marcador
  `test_guard.marker` lo crea el setup administrativo; la aplicación solo tiene
  `SELECT`. Las pruebas negativas del guard pasan y demuestran que un fallo
  detiene la suite antes de cualquier `DELETE`. Una ejecución con
  `TEST_DB_CONFIRM` incorrecto falló con el mensaje esperado sin limpiar datos.
- Auditorías: frontend 16 moderadas de desarrollo y 0 con `--omit=dev`;
  backend 3 moderadas de desarrollo y 0 con `--omit=dev`. IMP-003 sigue
  abierta.
- Validación visual, de teclado, foco y responsive de la integración actual:
  **pendiente en navegador real**. No se afirma que se haya ejecutado.
- La tarea queda en estado IMPLEMENTADA_PENDIENTE_VALIDACION.
- Esta validación no marca PF-01 a PF-24 como aprobadas para el sistema
  completo: no se ejecutó NGINX, Terraform ni la demostración integrada final.

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
| PF-18 | Fallo de BD en operaciones de registros | 503, sin detalles privados |
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
| PI-16 | Privilegios API | SELECT/INSERT/DELETE permitidos; UPDATE y DDL denegados |
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