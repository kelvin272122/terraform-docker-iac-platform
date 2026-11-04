# NGINX

## 1. Reglas importantes

- Respeta el AGENTS.md raíz.
- Esta carpeta controla HTTP, archivos estáticos y reverse proxy.
- Terraform controla cómo se despliega el contenedor.
- Sirve la compilación Angular y redirige /api al backend.
- Conserva la ruta /api conforme al contrato; no la elimines accidentalmente.
- Usa nombres o alias de red para localizar la API.
- No uses localhost para acceder a otro contenedor.
- Implementa fallback SPA solo para rutas de interfaz.
- No conviertas errores o rutas desconocidas de API en respuestas HTML.
- No publiques PostgreSQL ni añadas paneles de administración.
- No incorpores TLS, dominios externos o reglas adicionales sin aprobación.
- No agregues caché de respuestas API en esta versión.
- No expongas archivos fuente, configuración privada ni credenciales.
- Mantén recursos necesarios disponibles sin servicios externos.

### Validación
- Comprueba sintaxis mediante nginx -t en el entorno adecuado.
- Comprueba acceso a /estado y recarga directa de /registros.
- Verifica proxy de API y propagación de errores.
- Comprueba comportamiento tras recrear la API;
  evita depender de una IP interna fija.
- Si una verificación necesita contenedores no autorizados, registra el pendiente.
- Aplica el cierre definido en el AGENTS.md raíz.

## 2. Ubicaciones relevantes

Rutas desde la raíz:
- app/nginx/default.conf: configuración.
- app/frontend/Dockerfile: incorporación de archivos y configuración.
- app/frontend/AGENTS.md: consultar antes de modificar su build.
- infra/modules/app/: despliegue y redes.
- infra/AGENTS.md: consultar antes de modificar infraestructura.
- docs/arquitectura.md: rutas y conectividad.
- docs/despliegue.md: acceso y operación.
- docs/pruebas.md: verificaciones.
- docs/AGENTS.md: documentación.