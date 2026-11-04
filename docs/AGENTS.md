# Documentación del proyecto

## 1. Reglas importantes

### Alcance y lectura
- Estas instrucciones regulan los cambios dentro de docs/.
- Respeta las reglas comunes del AGENTS.md raíz.
- Consulta únicamente los documentos y archivos necesarios para la tarea.
- Antes de documentar un comportamiento técnico, revisa su implementación
  o la decisión aprobada que lo define.
- Si encuentras contradicciones entre requerimientos, documentación y código,
  informa la diferencia; no decidas automáticamente cuál debe cambiar.

### Organización y contenido
- Escribe en español claro y usa los nombres técnicos reales del proyecto.
- Mantén cada tema en su documento correspondiente y evita duplicaciones.
- Usa enlaces relativos para referenciar otros documentos y evidencias.
- Distingue lo propuesto, lo aprobado, lo implementado y lo verificado.
- Marca información desconocida como "Pendiente de definir"; no la inventes.
- No agregues documentos ni reorganices carpetas sin necesidad justificada.

### Actualización
- Actualiza solo los apartados afectados por la tarea.
- No cambies objetivos, alcance, requerimientos, reglas de negocio ni criterios
  de aceptación sin aprobación explícita.
- Registra en arquitectura.md las decisiones técnicas aprobadas y su motivo.
- Si un cambio afecta instalación, configuración, comandos o acceso,
  actualiza despliegue.md y revisa el README.md raíz.
- Actualiza el informe y el guion cuando el cambio afecte contenido ya redactado;
  no los completes anticipadamente con resultados supuestos.
- No modifiques archivos AGENTS.md salvo solicitud explícita.

### Pruebas y evidencias
- No presentes una prueba como ejecutada si no existe una ejecución real.
- Separa resultados esperados de resultados obtenidos.
- Para cada prueba ejecutada, registra entorno, resultado y evidencia disponible.
- No inventes capturas, mediciones, comandos ejecutados ni resultados.
- No incluyas contraseñas, tokens, archivos de estado ni datos privados.
- Advierte si un procedimiento puede eliminar recursos o datos e indica
  sus precondiciones.
- Distingue comandos documentados de comandos efectivamente verificados.

### Informe y cierre
- No inventes bibliografía, citas, conclusiones ni requisitos académicos.
- Usa el formato académico solicitado; si no está definido, déjalo pendiente.
- Antes de cerrar, comprueba rutas, enlaces y coherencia de los apartados editados.
- Resume qué documentos cambiaste y qué información quedó pendiente.
- Si una tarea no requiere cambios documentales, indícalo sin modificar archivos
  únicamente para registrar actividad.

## 2. Ubicaciones relevantes

### Documentos principales
- requerimientos.md:
  objetivos, alcance, exclusiones, requerimientos, reglas de negocio
  y criterios de aceptación.
- arquitectura.md:
  componentes, stack aprobado, redes, interfaces, modelo de datos
  y decisiones técnicas.
- despliegue.md:
  prerrequisitos, configuración, imágenes, entornos, operación,
  limpieza y recuperación.
- pruebas.md:
  casos, pasos, resultados esperados y obtenidos, y referencias a evidencias.

### Material de entrega
- diagramas/:
  fuentes editables y exportaciones de diagramas.
- evidencias/:
  capturas y resultados reales, sin información sensible.
- informe/informe-proyecto.md:
  informe académico.
- defensa/guion-demo.md:
  demostración, resultados esperados y alternativas ante fallos.

### Referencias fuera de docs/
- ../README.md:
  presentación del proyecto e instrucciones de entrada.
- ../app/frontend/:
  implementación del frontend.
- ../app/backend/:
  implementación de la API.
- ../app/database/:
  migraciones y datos iniciales.
- ../app/nginx/:
  configuración HTTP y reverse proxy.
- ../infra/:
  Terraform, configuración de entornos y scripts de infraestructura.

Las rutas anteriores son relativas a docs/. Antes de modificar archivos
fuera de esta carpeta, consulta el AGENTS.md del área correspondiente.