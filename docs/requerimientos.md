# Requerimientos — Panel de verificación IaC

## 1. Objetivo

Implementar una plataforma web local de tres capas, desplegada mediante
Terraform y Docker, para demostrar infraestructura como código,
configuración por entorno, persistencia, idempotencia, detección de drift
y destrucción controlada.

La aplicación actúa como instrumento de verificación de la infraestructura;
no administra Docker ni ejecuta Terraform.

## 2. Condiciones académicas

- Entregar un informe impreso con estructura de trabajo académico común.
- Presentar una implementación totalmente funcional durante la defensa.
- Ejecutar la demostración localmente.
- La fecha y la duración de la defensa no han sido establecidas.
- No se supone ningún otro requisito académico no confirmado.

## 3. Alcance

Incluye:
- Dashboard con información del despliegue.
- Comprobación real de API y PostgreSQL.
- Creación, consulta y eliminación de registros de demostración.
- Despliegue local de frontend/NGINX, API y PostgreSQL.
- Redes separadas y volumen persistente.
- Entornos dev y prod.
- Pruebas funcionales y de infraestructura.
- Documentación y evidencias de ejecución.

Excluye:
- Usuarios, autenticación y roles.
- Edición de registros, búsqueda, filtros y paginación.
- Redis, balanceo, réplicas y alta disponibilidad.
- Métricas históricas, alertas y monitoreo continuo.
- Control de contenedores desde la aplicación.
- Nube pública y servicios externos.
- Archivos adjuntos y exportaciones.
- Exposición pública y uso con datos sensibles.

## 4. Usuario

Operador local del laboratorio, sin inicio de sesión.

El acceso sin autenticación es una limitación deliberada del laboratorio.
No se presenta como una configuración adecuada para publicación en internet.

## 5. Requerimientos funcionales

### RF-01 — Información del despliegue
Mostrar entorno, versión frontend, versión API e identificador de instancia.
La versión frontend debe proceder de su compilación.
El entorno y los datos de API deben proceder del backend.
No mostrar secretos ni cadenas de conexión.

### RF-02 — Disponibilidad de API
Comprobar que la API responde y permitir actualizar la consulta manualmente.
Un fallo HTTP 503 por dependencia debe distinguirse de una API sin respuesta.

### RF-03 — Disponibilidad de PostgreSQL
Ejecutar desde la API una consulta SELECT 1.
Mostrar disponible, no disponible o desconocido.
Si la API no responde, la disponibilidad de PostgreSQL será desconocida.

### RF-04 — Crear registro
Solicitar título obligatorio y descripción opcional.
Evitar envíos duplicados mientras una solicitud esté en curso.
Después del éxito, limpiar el formulario y actualizar el listado.
Ante un error, conservar la información introducida.

### RF-05 — Consultar registros
Mostrar título, descripción, fecha de creación y total.
Ordenar por creación descendente y, como desempate, identificador.
Mostrar un estado vacío cuando no existan registros.
Los datos reales no se sustituyen por ejemplos si la API falla.

### RF-06 — Eliminar registro
Solicitar confirmación antes de eliminar.
Cancelar no debe generar ninguna solicitud.
Después del éxito, actualizar listado y total.
Ante un error, mantener el registro visible y comunicar el problema.

### RF-07 — Estados de interfaz
Distinguir carga, éxito, vacío, error y datos desactualizados.
Un error no debe dejar indicadores anteriores presentados como actuales.

## 6. Reglas de datos

- Identificador UUID generado por el servidor.
- Título: quitar espacios externos; entre 1 y 100 caracteres.
- Descripción: quitar espacios externos; hasta 500 caracteres.
- Descripción omitida, vacía o nula se almacena como null.
- Los títulos pueden repetirse.
- Fecha generada por el servidor y almacenada con zona horaria.
- API transmite fechas UTC ISO 8601.
- Interfaz muestra fecha local y permite identificar la zona horaria.
- Eliminación definitiva, sin papelera.
- Base de datos inicialmente vacía.
- Validación en backend obligatoria; frontend repite las reglas para UX.

## 7. Interfaz

- Nombre: Panel de verificación IaC.
- Logo SVG local sencillo, sin dependencia de servicios externos.
- Estilo serio y minimalista.
- Fondo claro, texto gris oscuro y acentos azul oscuro.
- Verde, ámbar y rojo acompañados de texto, no como único indicador.
- Tipografía del sistema; sin fuentes descargadas desde internet.
- Navegación lateral en escritorio y adaptable en móvil.
- Rutas: /estado y /registros.
- La raíz redirige a /estado.
- Rutas desconocidas muestran una página de no encontrado.
- Idioma visible: español.
- Sin modo oscuro en la primera versión.
- Operación por teclado, etiquetas asociadas y foco visible.
- Sin desplazamiento horizontal general a 360 px de ancho.

Estado:
- Tarjetas de entorno, versiones, API y PostgreSQL.
- Identificador de instancia y hora de última comprobación.
- Botón Actualizar.
- Carga inicial automática; sin sondeo periódico.

Registros:
- Formulario de creación.
- Listado adaptable.
- Confirmación de eliminación.
- Botón para actualizar manualmente.
- Mensajes claros y notificaciones accesibles.

## 8. Requerimientos de infraestructura

- RI-01: recursos creados declarativamente mediante Terraform.
- RI-02: PostgreSQL y API sin puertos publicados al host.
- RI-03: únicamente NGINX publica un puerto HTTP ligado a 127.0.0.1.
- RI-04: volumen independiente de PostgreSQL por entorno.
- RI-05: estados y nombres independientes para dev y prod.
- RI-06: plan sin cambios después de estabilizar el despliegue.
- RI-07: detección y recuperación de eliminación manual de la API.
- RI-08: cambios de configuración visibles en el plan.
- RI-09: destrucción completa del entorno seleccionado.
- RI-10: no modificar recursos Docker ajenos al proyecto.

## 9. Finalización

Una funcionalidad termina cuando:
- Cumple su comportamiento aprobado.
- Tiene validación y manejo de errores.
- Supera las pruebas aplicables.
- No contiene simulaciones activadas silenciosamente.
- Su documentación coincide con la implementación.

El proyecto termina cuando:
- Ambos entornos pueden desplegarse siguiendo la guía.
- Las pruebas obligatorias están ejecutadas y documentadas.
- El informe y el guion reflejan resultados reales.
- Las limitaciones están declaradas.