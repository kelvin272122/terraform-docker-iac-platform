# Frontend

## 1. Reglas importantes

- Respeta el AGENTS.md raíz.
- Antes de implementar, consulta los requerimientos y el contrato API relacionados.
- Usa Angular 21, Angular Material 21, TypeScript estricto y SCSS.
- Comprueba compatibilidad y versiones bloqueadas antes de instalar dependencias.
- Usa componentes standalone y formularios reactivos.
- Organiza por funcionalidades: estado y registros.
- Mantén servicios HTTP y modelos separados de los componentes.
- Usa signals para estado local cuando corresponda.
- No agregues bibliotecas globales de estado ni dependencias sin necesidad aprobada.
- Conserva el modo zoneless definido en la arquitectura.
- No añadas zone.js para resolver errores sin analizar primero su causa.
- El contexto de build del frontend es la raíz del repositorio.
- Usa app/frontend/Dockerfile y el .dockerignore raíz.
- No crees app/frontend/.dockerignore como si controlara ese contexto.
- Obtén la configuración NGINX desde app/nginx/default.conf.

### Interfaz
- Idioma visible: español; nombres de código consistentes en inglés.
- Dashboard sobrio, minimalista y adaptable, con recursos locales.
- Respeta rutas, formularios, mensajes y estados definidos en requerimientos.
- Incluye carga, vacío, éxito, error y datos desactualizados.
- Permite navegación por teclado y conserva foco visible.
- No añadas funcionalidades ni cambies reglas de negocio por iniciativa propia.

### API y simulación
- Usa /api como base relativa en el despliegue integrado.
- Usa el proxy de desarrollo para acceder al backend local.
- No incluyas secretos en el frontend.
- Respeta los tipos y errores del contrato.
- La simulación debe ser explícita, visible y ajustada al contrato.
- No actives simulación al fallar la API.
- No reintentes automáticamente operaciones de creación o eliminación.
- No presentes datos anteriores como comprobaciones actuales.

### Validación
- Ejecuta compilación y pruebas pertinentes.
- Comprueba formularios, navegación y estados de error.
- Ejecuta pruebas completas cuando la integración esté disponible.
- Si un comando aún no existe, no afirmes que se ejecutó.
- Aplica el cierre definido en el AGENTS.md raíz.

### Herramientas dentro de contenedores

- Genera, instala dependencias, desarrolla, compila y prueba el frontend
  dentro de contenedores.
- No requieras Node.js ni Angular CLI instalados en el host.
- Inicializa Angular mediante un contenedor temporal de Node.js,
  conservando los archivos generados en el repositorio.
- Usa una versión explícita de Angular CLI compatible con Angular 21.
- No crees un repositorio Git anidado.
- No sobrescribas ni elimines el AGENTS.md existente.
- No generes una carpeta frontend adicional dentro de app/frontend/.
- Evita archivos del proyecto con propietario root en Linux.
- Crea un Dockerfile con etapas development, build y runtime.
- La etapa runtime sirve Angular mediante NGINX.
- Documenta los comandos Docker reales y sus directorios de ejecución.
- No introduzcas Docker Compose ni sustituyas el despliegue Terraform.

## 2. Ubicaciones relevantes

Rutas desde la raíz:
- app/frontend/src/: implementación.
- app/frontend/public/: recursos públicos.
- app/frontend/package.json: scripts y dependencias.
- app/frontend/angular.json: configuración Angular.
- docs/requerimientos.md: pantallas, comportamiento y validaciones.
- docs/arquitectura.md: convenciones y contrato API.
- docs/pruebas.md: verificaciones obligatorias.
- app/nginx/AGENTS.md: consultar antes de modificar NGINX.
- app/backend/AGENTS.md: consultar antes de modificar la API.
- docs/AGENTS.md: documentación.