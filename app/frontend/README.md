# Frontend — Panel de verificación IaC

Base del frontend del Panel de verificación IaC, generada con Angular CLI
21.2.29 y Angular 21.2.26.

## Estado implementado

- Aplicación Angular 21 inicial compilable.
- Componentes standalone, routing, SCSS, TypeScript estricto, modo zoneless
  y sin SSR.
- `package-lock.json` conservado para una instalación reproducible.
- Dashboard, Angular Material, formularios, listados e integración con la API
  todavía no están implementados.

## Prerrequisitos y ejecución

Node.js, npm y Angular CLI no se instalan en el host. Los comandos se ejecutan
dentro del contenedor documentado en el [README raíz](../../README.md), que
incluye los prerrequisitos, la imagen fijada y los comandos Docker verificados
de instalación, pruebas, compilación y servidor de desarrollo.

Desde `app/frontend/`, como referencia técnica dentro de ese contenedor:

- `npm start` inicia el servidor de desarrollo.
- `npm run build` compila la aplicación en
  `dist/iac-panel-frontend/browser/`.
- `npm test -- --watch=false` ejecuta las pruebas unitarias una sola vez.
- `npm run ng -- generate component nombre` genera un componente.

## Estructura

- `src/`: código de la aplicación.
- `public/`: recursos públicos.
- `angular.json`: configuración del workspace.
- `package.json`: scripts y dependencias.

## Documentación

- [README raíz](../../README.md): comandos Docker verificados y prerrequisitos.
- [Requerimientos](../../docs/requerimientos.md)
- [Arquitectura](../../docs/arquitectura.md)
- [Despliegue](../../docs/despliegue.md)
- [Pruebas](../../docs/pruebas.md)
