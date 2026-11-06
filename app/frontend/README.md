# Frontend — Panel de verificación IaC

Base del frontend del Panel de verificación IaC, generada con Angular CLI
21.2.29 y Angular 21.2.26.

## Estado implementado

- Aplicación Angular 21 con primera estructura visual compilable.
- Componentes standalone, routing, SCSS, TypeScript estricto, modo zoneless
  y sin SSR.
- Angular Material y CDK 21.2.14 instalados; shell con navegación lateral,
  rutas `/estado` y `/registros`, redirección desde `/`, página 404 y logo SVG
  local adaptable.
- Estado y Registros muestran solo estructuras y mensajes neutrales; no hay
  llamadas a `/api`, datos simulados ni métricas ficticias.
- Dashboard funcional, formularios, listados e integración con la API todavía
  no están implementados.
- Validación manual del usuario completada el 2026-11-05: renderizado, rutas,
  navegación, 404, consola sin errores de la aplicación observados, red sin
  solicitudes a `/api`, vista de 360 px, menú móvil, teclado y foco visible.
  No fue automatizada ni ejecutada por el agente.
- `package-lock.json` conservado para una instalación reproducible.

## Prerrequisitos y ejecución

Node.js, npm y Angular CLI no se instalan en el host. Los comandos se ejecutan
dentro del contenedor documentado en el [README raíz](../../README.md), que
incluye los prerrequisitos, la imagen fijada y los comandos Docker verificados
de instalación, pruebas, compilación y servidor de desarrollo.

Esos comandos usan el perfil endurecido validado en IMP-005: usuario no root,
límites por contenedor, `--cap-drop=ALL`, `no-new-privileges`, raíz de solo
lectura y `/tmp` en tmpfs. No es una corrección de las alertas de seguridad de
IMP-003. La validación del perfil fue por comandos y HTTP, no visual.

Desde `app/frontend/`, como referencia técnica dentro de ese contenedor:

- `npm start` inicia el servidor de desarrollo.
- `npm run build` compila la aplicación en
  `dist/iac-panel-frontend/browser/`.
- `npm test -- --watch=false` ejecuta las pruebas unitarias una sola vez.
- `npm run ng -- generate component nombre` genera un componente.

## Estructura

- `src/`: código de la aplicación.
- `src/app/features/`: páginas de estado y registros.
- `src/app/shared/`: componentes compartidos, incluida la página 404.
- `public/`: recursos públicos, incluido `logo.svg`.
- `angular.json`: configuración del workspace.
- `package.json`: scripts y dependencias.

## Documentación

- [README raíz](../../README.md): comandos Docker verificados y prerrequisitos.
- [Requerimientos](../../docs/requerimientos.md)
- [Arquitectura](../../docs/arquitectura.md)
- [Despliegue](../../docs/despliegue.md)
- [Pruebas](../../docs/pruebas.md)
