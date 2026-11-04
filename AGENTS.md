# AGENTS.md

## 1. Reglas importantes

### Alcance y contexto
- Identifica las áreas afectadas antes de modificar archivos.
- Antes de trabajar en un área, lee su AGENTS.md indicado en la sección 2.
- No cargues todos los AGENTS.md ni toda la documentación al iniciar.
- Lee únicamente los archivos necesarios para resolver la tarea.
- Si descubres dependencias con otra área, lee sus instrucciones antes de modificarla.
- Las reglas locales complementan las comunes; no eliminan sus restricciones.
- Si hay instrucciones contradictorias, informa el conflicto antes de continuar.

### Desarrollo
- Respeta los requerimientos y decisiones aprobados del proyecto.
- No inventes reglas de negocio ni cambies el stack o la arquitectura sin aprobación.
- Realiza cambios pequeños y limitados a la tarea.
- Conserva las convenciones existentes; evita refactorizaciones no solicitadas.
- No expongas secretos ni versiones archivos de estado, credenciales o datos privados.
- No ejecutes despliegues, migraciones sobre datos existentes ni acciones destructivas
  sin autorización explícita.
- No crees commits ni hagas push salvo que se solicite.

### Documentación y mantenimiento
- Antes de cerrar una tarea con cambios, lee docs/AGENTS.md y evalúa su impacto documental.
- Actualiza únicamente los documentos afectados por cambios implementados y verificados.
- Revisa README.md si cambian requisitos de instalación, comandos, acceso o estructura.
- No modifiques requerimientos ni amplíes el alcance sin aprobación.
- No cambies AGENTS.md automáticamente: propone las nuevas convenciones y espera aprobación.
- Si no corresponde actualizar documentación, indícalo brevemente en el resumen final.

### Validación y entrega
- Ejecuta las verificaciones pertinentes indicadas en el AGENTS.md del área.
- No afirmes que una prueba pasó si no la ejecutaste.
- Resume los cambios, las validaciones, la documentación actualizada y los pendientes.

### Inicio y continuidad
- Al iniciar una sesión o retomar una tarea, lee MEMORIA.md.
- Consulta BITACORA.md solo para las implementaciones relacionadas con la tarea.
- La memoria y la bitácora son registros de trabajo, no sustituyen los
  requerimientos, las decisiones aprobadas ni el código.
- Comprueba en los archivos pertinentes que la información necesaria sigue vigente.
- Si existe una contradicción material, informa la diferencia antes de decidir
  cambios de alcance, arquitectura o comportamiento.

### Cierre de una implementación
- Antes de cerrar una implementación o detener un trabajo incompleto:
  1. Ejecuta las validaciones aplicables y registra sus resultados reales.
  2. Lee docs/AGENTS.md y actualiza la documentación afectada.
  3. Revisa README.md y corrige sus instrucciones si cambió el uso del proyecto.
  4. Agrega o actualiza la implementación correspondiente en BITACORA.md.
  5. Actualiza MEMORIA.md con el estado actual y el siguiente paso.
- No modifiques archivos únicamente para aparentar actividad.
- No declares terminada una implementación con verificaciones obligatorias
  pendientes: usa el estado IMPLEMENTADA_PENDIENTE_VALIDACION.
- Si un trabajo queda incompleto o bloqueado, registra qué se hizo y qué falta.
- Estos cambios de documentación forman parte de la misma tarea; no requieren
  una autorización adicional, salvo que alteren decisiones aprobadas.

### Reglas de los registros
- MEMORIA.md debe ser un resumen breve, no un historial.
- BITACORA.md debe registrar una entrada por implementación lógica,
  no una entrada por archivo o comando.
- No guardes secretos, datos privados, logs completos ni conversaciones.
- No inventes resultados, fechas de ejecución ni identificadores de commits.
- No marques una prueba como aprobada si no se ejecutó.

## 2. Ubicaciones relevantes

### Instrucciones por área
- Frontend: app/frontend/AGENTS.md
- Backend/API: app/backend/AGENTS.md
- Base de datos, migraciones y seeds: app/database/AGENTS.md
- NGINX y reverse proxy: app/nginx/AGENTS.md
- Terraform, recursos Docker y despliegue: infra/AGENTS.md
- Documentación, evidencias e informe: docs/AGENTS.md

### Documentación del proyecto
- Alcance, requerimientos y reglas de negocio: docs/requerimientos.md
- Arquitectura y contratos entre componentes: docs/arquitectura.md
- Instalación, despliegue y operación: docs/despliegue.md
- Casos de prueba y resultados: docs/pruebas.md
- Guía de entrada al repositorio: README.md

### Continuidad y seguimiento
- MEMORIA.md: estado actual, restricciones y siguiente paso.
- BITACORA.md: implementaciones, estados, validaciones y pendientes.
- README.md: instrucciones actuales de instalación y ejecución.

### Mantenimiento obligatorio del README

- README.md es la guía operativa actual del proyecto.
- Si no existe, créalo como parte de la primera implementación.
- Antes de cerrar cualquier implementación, lee README.md y comprueba
  si sigue describiendo correctamente el estado y la ejecución del proyecto.
- Actualízalo directamente, sin esperar una solicitud adicional, cuando cambien:
  - Herramientas, versiones o dependencias necesarias.
  - Instalación y configuración.
  - Variables de entorno y archivos de ejemplo.
  - Comandos de desarrollo, construcción, pruebas o despliegue.
  - Puertos, URLs y rutas de acceso.
  - Migraciones o inicialización de la base de datos.
  - Limpieza, destrucción o advertencias sobre pérdida de datos.
  - Funcionalidades disponibles o limitaciones relevantes.
- Obtén los comandos de los archivos reales del proyecto:
  package.json, scripts, Dockerfiles y configuración Terraform.
- No presentes comandos previstos como si ya estuvieran implementados.
- Distingue los pasos verificados de los que no pudieron ejecutarse.
- Incluye el directorio desde el que debe ejecutarse cada comando
  y sus prerrequisitos.
- No incluyas secretos ni valores privados; referencia .env.example
  u otros ejemplos sin credenciales.
- Mantén el README breve y enlaza a docs/ para explicaciones detalladas.
- No reemplaces todo el archivo si basta con actualizar un apartado.
- Si no requiere cambios, no lo modifiques y registra en BITACORA.md:
  "README revisado: sin cambios necesarios".
- No declares cerrada la implementación sin revisar el README.