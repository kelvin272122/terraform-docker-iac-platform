# Frontend — Panel de verificación IaC

Frontend Angular 21 del Panel de verificación IaC, integrado con la API real.

## Estado implementado

- Aplicación Angular 21 con componentes standalone, routing, SCSS, TypeScript
  estricto, modo zoneless y sin SSR.
- Angular Material y CDK 21.2.14; shell con navegación lateral, rutas `/estado`
  y `/registros`, redirección desde `/`, página 404 y logo SVG local.
- Estado consume `/api/info` y `/api/health` de forma independiente.
- Registros consume `GET`, `POST` y `DELETE /api/records` con validación de
  contratos en runtime, errores por campo y confirmación de eliminación.
- Sin datos simulados, sin sondeo periódico y sin reintentos automáticos de
  mutaciones.
- Versión de interfaz generada desde `package.json` durante la compilación.
- Pruebas: 14 archivos y 62 pruebas aprobadas.
- Validación de navegador completada con Playwright 1.65.0 y Chromium 158
  headless: foco del diálogo, cancelación, Escape, Tab/Shift+Tab, enlace de
  salto, listado desactualizado, recuperación y consola. Evidencias en
  `docs/Evidencias/IMP-009/`.

## Versión de interfaz

- `package.json` fija la versión `0.1.0`.
- `scripts/generate-frontend-version.mjs` genera
  `src/app/core/frontend-version.generated.ts` de forma determinista.
- Los hooks `prestart`, `prebuild` y `pretest` ejecutan la generación.
- El archivo generado está ignorado por Git.
- La versión mostrada es la de la interfaz, distinta de `APP_VERSION` del
  backend.

## Proxy de desarrollo

`proxy.conf.json`:

```json
{
  "/api/**": {
    "target": "http://api:3000",
    "secure": false,
    "changeOrigin": true
  }
}
```

- Se aplica por defecto desde `angular.json` (`serve.options.proxyConfig`).
- Conserva el prefijo `/api`.
- Coincide con `/api` y subrutas, no con `/api-docs`.
- El destino es el alias Docker `api`, nunca `localhost`.
- No se añade CORS.

## Prerrequisitos y ejecución

Node.js, npm y Angular CLI no se instalan en el host. Los comandos se ejecutan
dentro de los contenedores documentados en el [README raíz](../../README.md).

Desde `app/frontend/`, dentro del contenedor:

- `npm start -- --host 0.0.0.0 --port 4200`: servidor de desarrollo con proxy.
- `npm run build`: compilación en `dist/iac-panel-frontend/browser/`.
- `npm test -- --watch=false`: pruebas unitarias y de componentes.
- `npm run generate:version`: genera la constante de versión.

`ng test` y `ng serve` compilan la aplicación. En esta integración se usó el
perfil de compilación de 4 CPU y 4 GiB; con 2 GiB `ng test` fue terminado
(exit 137). Instalación: 2 CPU y 2 GiB.

## Entorno integrado de desarrollo

Usar nombres únicos para evitar colisiones:

```bash
SUFFIX=$(date +%s)
NET_FRONT="iac-dev-front-$SUFFIX"
NET_BACK="iac-dev-back-$SUFFIX"
PG="iac-dev-pg-$SUFFIX"
VOL="iac-dev-pgdata-$SUFFIX"
API="iac-dev-api-$SUFFIX"
WEB="iac-dev-web-$SUFFIX"

docker network create "$NET_FRONT"
docker network create --internal "$NET_BACK"
docker volume create "$VOL"
```

- PostgreSQL: red `"$NET_BACK"`, alias `postgres`, sin puertos publicados.
- API: red `"$NET_FRONT"` con alias `api`; conectar también a `"$NET_BACK"`;
  sin puertos publicados.
- Angular: red `"$NET_FRONT"`; publicar solo `127.0.0.1:4200:4200`.
- Rol de aplicación, migración y grants: ver
  [app/backend/README.md](../backend/README.md).
- Para detener y limpiar, eliminar solo `"$WEB"`, `"$API"`, `"$PG"`,
  `"$NET_FRONT"`, `"$NET_BACK"` y `"$VOL"` creados con ese sufijo.

Comprobaciones por proxy:

```bash
curl -sS http://127.0.0.1:4200/api/info
curl -sS http://127.0.0.1:4200/api/health
curl -sS http://127.0.0.1:4200/api/records
```

## Estructura

- `src/app/core/`: modelos, HTTP, configuración, validadores y pipes.
- `src/app/features/status/`: estado del despliegue.
- `src/app/features/records/`: formulario, listado y confirmación de borrado.
- `src/app/shared/`: página 404.
- `proxy.conf.json`: proxy de desarrollo.
- `scripts/`: generación de la versión de interfaz.

## Documentación

- [README raíz](../../README.md)
- [Requerimientos](../../docs/requerimientos.md)
- [Arquitectura](../../docs/arquitectura.md)
- [Despliegue](../../docs/despliegue.md)
- [Pruebas](../../docs/pruebas.md)
