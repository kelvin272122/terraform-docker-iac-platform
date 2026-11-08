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

### Validación de navegador de IMP-009 con Playwright (2026-11-07)

- Antecedente: `WebKitWebDriver` 2.54.2 con Epiphany 50.6 falló; la navegación
  quedó en `about:blank` incluso con una página estática. Se detuvo esa vía.
- Entorno: `mcr.microsoft.com/playwright:v1.65.0-noble` fijado por digest
  `sha256:bc4fbb329a25287ed23e9216c97063646abdd1bf2da669a9895fa3e2078b2302`,
  Playwright 1.65.0, Chromium 158.0.8127.18, Node 26 y Ubuntu noble.
- Ejecución headless. `chromiumSandbox` se usó en `false`: el primer intento
  con `true` falló por incompatibilidad de sandbox en la prueba mínima. La
  excepción quedó limitada al contenedor temporal y a la aplicación local.
- Conectividad: contenedor en la red frontend, regla de resolución
  `MAP localhost 172.20.0.3`; Chromium cargó la aplicación real por
  `http://localhost:4200`. No se modificó `allowedHosts`, no se publicó en
  `0.0.0.0` ni se usó red host o socket Docker.
- Evidencias sanitizadas: `docs/Evidencias/IMP-009/2026-11-07-browser/`.
- Capturas: Estado inicial, Registros con datos, Estado con BD detenida,
  Estado con API detenida, Registros con API detenida, 360 px y 960 px.
- La captura esperada de Registros con BD detenida no se generó porque el caso
  se detuvo en la aserción de datos desactualizados.

#### Matriz de resultados

| Caso | Método | Backend | Resultado | Limitación |
|---|---|---|---|---|
| Carga estática mínima | Navegador | N/A | APROBADO | — |
| Carga de la aplicación Angular | Navegador | Real | APROBADO | — |
| Estado inicial: entorno, versiones e instancia | Navegador | Real | APROBADO | — |
| Actualización manual sin duplicados | Navegador | Real | APROBADO | 1 info y 1 health por acción |
| Registros: estado vacío | Navegador | Real | APROBADO | — |
| Registros: crear y verificar listado/total | Navegador | Real | APROBADO | — |
| Registros: persistencia tras recarga | Navegador | Real | APROBADO | — |
| Registros: descripción omitida | Navegador | Real | APROBADO | — |
| Registros: 100 emoji | Navegador | Real | APROBADO | — |
| Registros: rechazo de 101 emoji | Navegador | Real | APROBADO | — |
| Registros: límites 500/501 de descripción | Navegador | Real | APROBADO | — |
| Registros: doble envío | Navegador | Real | APROBADO | Doble submit programático en navegador; 1 POST |
| Registros: cancelar eliminación | Navegador | Real | FALLÓ | Foco inicial en «Eliminar», no en «Cancelar»; el caso se detuvo antes de cancelar |
| Registros: confirmar eliminación | Navegador | Real | APROBADO | 204 y listado actualizado |
| Registros: error 400 por campo | Navegador | Interceptada | APROBADO | Backend no ejecutado |
| Registros: timeout de POST | Navegador | Interceptada | APROBADO | Backend no ejecutado; sin reintento |
| Registros: respuesta perdida con persistencia real | Navegador | Real + respuesta interceptada | APROBADO | POST real reenviado al backend y persistencia verificada |
| Registros: POST confirmado y recarga fallida | Navegador | Real POST + GET interceptado | APROBADO | Éxito conservado y listado desactualizado |
| Registros: respuesta inválida | Navegador | Interceptada | APROBADO | Backend no ejecutado |
| Estado: BD detenida | Navegador + host | Real | APROBADO | API disponible, BD no disponible; sin marcar histórico |
| Registros: BD detenida | Navegador + host | Real | FALLÓ (expectativa) | Se mostró error; no se mostró `stale` porque la página se cargó sin datos previos. El mecanismo stale se aprobó en la recarga fallida |
| Recuperación de PostgreSQL | Navegador + host | Real | APROBADO | — |
| Recuperación del listado con PostgreSQL | Navegador + host | Real | APROBADO | — |
| Estado: API detenida | Navegador + host | Real | APROBADO | BD desconocida, no presentada como caída |
| Registros: API detenida | Navegador + host | Real | APROBADO | Error mostrado, sin datos ficticios |
| Recuperación de la API | Navegador + host | Real | APROBADO | — |
| Enlace Saltar al contenido | Navegador | Real | FALLÓ (sincronización) | Tab y foco parcialmente comprobados; la navegación de hash destruyó el contexto |
| Diálogo: foco, Escape y retorno | Navegador | Real | BLOQUEADO | Interrumpido por navegación de hash pendiente; foco inicial ya falló en el caso de cancelación |
| Responsive 360 px | Navegador | Real | APROBADO | Sin overflow; menú móvil |
| Breakpoint 959/960 | Navegador | Real | APROBADO | — |
| Red y proxy | Navegador | Real | APROBADO | 71 solicitudes API por `/api`; 0 recursos externos |
| Consola sin errores inesperados | Navegador | Real | FALLÓ (clasificación) | 5 errores de red de fases deliberadas de BD/API detenidas; 0 `pageerror`; revisión manual no evidencia error inesperado |

#### Incidencia de accesibilidad

- Caso: foco inicial del diálogo de eliminación.
- Pasos: con servicios activos, abrir `/registros`, pulsar «Eliminar» en un
  registro y leer `document.activeElement`.
- Esperado: foco en «Cancelar».
- Observado: foco en «Eliminar».
- Impacto: el diálogo permite confirmar una acción destructiva con Enter sin
  desplazar el foco de forma segura. No se corrigió el código.
- Propuesta pendiente de aprobación: fijar el foco inicial en «Cancelar»
  mediante `cdkFocusInitial`/`A11yModule` o un selector `autoFocus` explícito,
  y repetir las comprobaciones de cancelación, Escape y retorno de foco.

#### Limitaciones de ejecución

- El caso de cancelación no llegó a enviar/verificar el DELETE por el fallo de
  foco; no se afirma que cancele correctamente.
- El caso de enlace de salto no completó la comprobación posterior al Enter.
- El caso de diálogo con Escape/retorno quedó bloqueado por la navegación de
  hash pendiente del caso anterior.
- El caso de Registros con BD detenida necesita cargar el listado con datos
  antes de detener PostgreSQL para evaluar `stale`.
- La clasificación automática de consola no marcó como intencionales los
  errores de red de las paradas de BD/API.
- No se modificó código de la aplicación para corregir estas incidencias.
- Estado en esa ejecución: pendiente de corrección. La corrección y la
  revalidación final se registran a continuación.

### Corrección y revalidación final de IMP-009 (2026-11-07)

- Causa del defecto: el diálogo abría con `autoFocus: 'first-tabbable'` y el
  foco inicial quedaba en «Eliminar».
- Corrección: se añadió la clase estable `dialog-cancel` al botón «Cancelar» y
  se configuró `autoFocus: '.dialog-cancel'` en la apertura del diálogo.
- Foco posterior a una eliminación confirmada: el primer ajuste apuntó al
  botón «Actualizar» del listado, pero Chromium mostró el foco en `BODY`
  porque el botón queda deshabilitado durante la recarga. Se corrigió
  enfocando el encabezado `#records-title` con `tabindex="-1"`, que siempre
  existe y es un destino lógico.
- Archivos modificados:
  - `app/frontend/src/app/features/records/confirm-delete-dialog/confirm-delete-dialog.html`
  - `app/frontend/src/app/features/records/confirm-delete-dialog/confirm-delete-dialog.spec.ts`
  - `app/frontend/src/app/features/records/records-page.ts`
  - `app/frontend/src/app/features/records/records-page.html`
  - `app/frontend/src/app/features/records/records-page.spec.ts`
- Pruebas frontend posteriores: 14 archivos y 62 pruebas aprobadas.
- Compilación frontend: exit 0 con la advertencia ya conocida de presupuesto
  inicial (528.53 kB frente a aviso de 500 kB; por debajo del error de 1 MB).
- No se repitieron las suites de backend porque no fueron afectadas.

#### Revalidación 1 (navegador, Chromium headless)

| Caso | Resultado | Evidencia/limitación |
|---|---|---|
| Foco inicial del diálogo en Cancelar | APROBADO | Verificado con Chromium tras la corrección |
| Enter desde Cancelar | APROBADO | Cancela; sin DELETE |
| Clic en Cancelar | APROBADO | Sin DELETE; retorno de foco al disparador |
| Escape | APROBADO | Sin DELETE; retorno de foco |
| Tab y Shift+Tab | APROBADO | Foco confinado en el diálogo |
| Confirmar Eliminar | FALLÓ (foco posterior) | DELETE 1, 204 y listado actualizado; foco posterior en `BODY` |
| Saltar al contenido | APROBADO | Destino `#main-content`, foco en el contenido y siguiente Tab lógico |
| Listado desactualizado con BD detenida | APROBADO | Error visible, datos anteriores conservados y `stale` presente |
| Recuperación de PostgreSQL | APROBADO | El estado desactualizado desaparece |
| Consola | APROBADO | 0 errores inesperados; 0 `pageerror` |
| Carga estática mínima | FALLÓ (prueba) | Codificación del `data:` URL; la aplicación cargó correctamente |

#### Revalidación 2 (navegador, Chromium headless)

| Caso | Resultado | Evidencia |
|---|---|---|
| Carga estática mínima | APROBADO | URL con `charset=utf-8` |
| Carga de la aplicación Angular | APROBADO | — |
| Regresión del foco inicial en Cancelar | APROBADO | — |
| Eliminar confirmado, un DELETE 204 y listado actualizado | APROBADO | — |
| Foco posterior en destino lógico | APROBADO | `H1#records-title` enfocado y conectado |
| Consola y errores de página | APROBADO | 0 errores inesperados; 0 `pageerror` |

- Evidencias:
  - `docs/Evidencias/IMP-009/2026-11-07-revalidacion-1/`
  - `docs/Evidencias/IMP-009/2026-11-07-revalidacion-2/`
- Recursos temporales eliminados; imagen Playwright conservada por digest.
- **IMP-009 COMPLETADA.** Los criterios pendientes de foco, cancelación,
  Escape, retorno de foco, enlace de salto, datos desactualizados y consola
  quedaron cubiertos.

### Validación de imágenes, Dockerfiles y NGINX (IMP-010) — 2026-11-07

- Bases verificadas:
  - `node:24.13.1-bookworm-slim@sha256:a81a03dd965b4052269a57fac857004022b522a4bf06e7a739e25e18bce45af2`.
  - `nginx/nginx-unprivileged:1.30.6-alpine3.24-slim@sha256:016193c18ef1ce19dc2229d3305f69af1b05e0bc0e8fe6ee724a58bd305f3855`.
  - `postgres:17.11-bookworm@sha256:665dc7b37ac52a17e298511414c21d23ffa4e6a6ef6225b3e5d59c7afb35e994`.
- Imágenes construidas:
  - `iac-panel-web:0.1.0` — `sha256:45994eab833cd14f26f910a78bb35e72a204127e0537d780f02c1e64467e851c` — 22.2 MB.
  - `iac-panel-api:0.1.0` — `sha256:33d2f1d57344599d2303393b440598257085b667e3b8bdc78e6b0550a12ae7a3` — 325 MB.
  - `iac-panel-api-migrate:0.1.0` — `sha256:2dcea5fc7c988d9f9f7a816016b6ec70469f8ea8d5347e382dfe3d8f25d1f589` — 553 MB.
- Frontend/NGINX:
  - Usuario 101; sin Node/npm/`node_modules`/fuente.
  - Puerto 8080; `SIGQUIT`; temporales en `/tmp`; arranque con `--read-only`.
  - `nginx -t` y `nginx -T` correctos; snippet de proxy incluido.
  - SPA `/`, `/estado`, `/registros` y ruta desconocida: 200 con `app-root`.
  - `/api-docs`: 404 sin proxy.
  - API ausente al arrancar: 502 JSON `UPSTREAM_UNAVAILABLE`, no-store.
- API runtime:
  - Usuario `node` (uid 1000), Node 24.13.1, `SIGTERM`.
  - `pg` 8.23.1 y `express` 5.3.0; sin `node-pg-migrate`, TypeScript, Vitest ni Supertest.
  - Arranque con `--read-only`; `/api/info`, `/api/health` y `/api/records` correctos.
- Migración y grants:
  - Binario real `node_modules/node-pg-migrate/bin/node-pg-migrate.js`.
  - Primera migración aplicada; segunda sin cambios; una fila en `pgmigrations`.
  - Grants con `psql` desde la imagen oficial de PostgreSQL.
  - Rol de aplicación con `SELECT`, `INSERT` y `DELETE`; sin `UPDATE`,
    `TRUNCATE` ni `CREATE`.
- Integración:
  - Solo NGINX publicó `127.0.0.1:18080`; API y PostgreSQL sin puertos; red backend interna.
  - `/api/info`, `/api/health` y `/api/records`: 200 JSON con `Cache-Control: no-store`.
  - Prefijo y query string conservados: `/api/probe?x=1&y=2` llegó completo a un servidor de eco.
  - API recreada con nueva IP: `instanceId` cambió y el proxy recuperó sin reiniciar NGINX.
  - API detenida: 502 JSON `UPSTREAM_UNAVAILABLE`, no-store; recuperación a 200.
  - Error de backend conservado: 400 `VALIDATION_ERROR` JSON.
  - 17 KiB: 413 JSON de Express; 1.1 MiB: 413 JSON de NGINX; ambos no-store.
  - PostgreSQL detenido con API viva: health 503 válido y records 503 JSON, no-store.
  - Persistencia tras recrear PostgreSQL con el mismo volumen: registro conservado.
  - Cierre: NGINX y API exit 0; PostgreSQL exit 0.
- Limitaciones:
  - No se validó visualmente la aplicación servida por la imagen NGINX; la evidencia de navegador de IMP-009 se conserva separada.
  - No se implementaron TLS, CORS, Terraform ni Compose.
  - El aviso de presupuesto Angular de 528.53 kB se mantiene sin cambios.
- Evidencias: `docs/Evidencias/IMP-010/`.

### Validación de Terraform y scripts de despliegue (IMP-011) — 2026-11-08

- Entorno: Windows 11 Pro, Git Bash, Docker Desktop 29.6.2 (VM de 12 CPU y
  ~3.9 GB), Terraform 1.17.0, `kreuzwerker/docker` 4.6.0 y
  `hashicorp/random` 3.9.1. Imágenes 0.1.0 construidas con
  `infra/scripts/build-images.sh 0.1.0`.
- Estáticas: `terraform fmt -check -recursive`, `terraform validate` y
  `bash -n` de los cinco scripts, sin errores.
- Desplegadas: dev (`127.0.0.1:8080`) y prod (`127.0.0.1:8081`) en paralelo;
  `smoke-test.sh` aprobado en ambos (7/7 comprobaciones).
- Resultados por prueba en la sección 5; detalle y salidas sanitizadas en
  `docs/Evidencias/IMP-011/`, con capturas de navegador de dev y prod.
- Incidencias corregidas durante la validación: rutas de Git Bash, deriva por
  `memory_swap` e IPv6, recreaciones causadas por `depends_on`, `instanceId`
  fijo, CRLF en el script de inicialización (falló el primer despliegue de
  prod; se completó sin borrar datos) y un valor sensible impreso en una
  evidencia (eliminado; dev recreado con contraseñas nuevas). Ver
  `docs/Evidencias/IMP-011/resumen.md`.
- PI-18 se simuló con un proxy inexistente (`127.0.0.1:9`) que corta el
  acceso de Terraform y curl a internet; detectó que `terraform init` necesita
  el registro y se corrigió con `tf_init()`. Conviene repetirla con la red
  desconectada.
- PI-19: versión 0.1.1 temporal, despliegue, verificación y rollback a 0.1.0.

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

| ID | Prueba | Resultado esperado | Estado (2026-11-08) | Resultado obtenido |
|---|---|---|---|---|
| PI-01 | Formato y validación | Sin errores | APROBADA | fmt, validate y `bash -n` sin errores |
| PI-02 | Despliegue desde prerrequisitos | Recursos y aplicación operativos | APROBADA | 9 recursos, migración, grants y salud 200 |
| PI-03 | Reaplicar migraciones | Sin duplicación ni pérdida | APROBADA | `No migrations to run!`; testigo conservado |
| PI-04 | Plan posterior estable | Sin cambios inesperados | APROBADA | `No changes` en dev y prod (exit 0) |
| PI-05 | Recrear API | Servicio vuelve; datos conservados | APROBADA | `instanceId` cambió; testigo presente |
| PI-06 | Recrear BD manteniendo volumen | Registro testigo conservado | APROBADA | Solo se recreó PostgreSQL; testigo presente |
| PI-07 | Inspeccionar puertos | Solo NGINX publicado en loopback | APROBADA | 8080 y 8081 en 127.0.0.1; 3000 y 5432 inaccesibles |
| PI-08 | Inspeccionar redes | Membresías acordadas y BD aislada de frontend_net | APROBADA | backend interna, sin salida a internet |
| PI-09 | Ejecutar dev y prod | Puertos, recursos y datos separados | APROBADA | Datos, volúmenes, estados y contraseñas distintos |
| PI-10 | Variables/workspace discordantes | Despliegue bloqueado | APROBADA | Precondición falla en `default` y con prod.tfvars en dev |
| PI-11 | Cambiar puerto de prueba | Plan muestra efecto y app accesible | APROBADA | 8080 -> 8090 visible en el plan; 200 en 8090; restaurado |
| PI-12 | Eliminar API manualmente | Plan detecta recurso ausente | APROBADA | 504 JSON de NGINX; plan exit 2 con la API a crear |
| PI-13 | Aplicar recuperación | API recreada y salud correcta | APROBADA | Salud 200 y plan posterior estable |
| PI-14 | Destruir dev | Recursos dev eliminados y prod intacto | APROBADA | Confirmación errónea cancela; dev 0 recursos; prod intacto |
| PI-15 | Recrear tras destrucción total | Base vacía y esquema reconstruido | APROBADA | 0 registros; `records` y `pgmigrations` recreadas |
| PI-16 | Privilegios API | SELECT/INSERT/DELETE permitidos; UPDATE y DDL denegados | APROBADA | UPDATE, TRUNCATE, CREATE y DROP denegados |
| PI-17 | Revisar secretos | Sin secretos en Git, UI ni evidencias | APROBADA | 0 coincidencias tras corregir una evidencia |
| PI-18 | Defensa desconectada | Operaciones previstas sin descargas nuevas | APROBADA (simulada) | Sin acceso a internet: deploy y smoke de prod correctos; init nuevo falla como se espera |
| PI-19 | Nueva versión de imagen | Contenedor usa build nuevo y versión correcta | APROBADA | 0.1.1 en API e interfaz; solo API y NGINX recreados; rollback a 0.1.0 con datos |

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