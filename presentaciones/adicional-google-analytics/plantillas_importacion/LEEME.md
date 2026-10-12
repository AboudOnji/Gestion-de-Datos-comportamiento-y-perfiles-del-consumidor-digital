# Plantillas de importación para Google Analytics 4 (datos SINTÉTICOS)

Basadas en las plantillas de la ayuda oficial de Google Analytics (consultadas el 12-oct-2026). **Son ejemplos didácticos:
ninguna fila corresponde a una persona, una marca ni una campaña real.** Antes de usarlas en una propiedad real, compara
los encabezados con la plantilla vigente de la ayuda (la interfaz y los esquemas cambian).

| Archivo | Tipo de importación en GA4 | Notas clave |
|---|---|---|
| `1_costos_campana.csv` | Datos de campaña (costo) | `utm_source`, `utm_medium` y `date` (AAAA-MM-DD) son obligatorios; al menos clics, costo o impresiones. La moneda se define al mapear los campos (ISO 4217, p. ej. MXN). |
| `2_productos_item.csv` | Datos de artículos (item) | Llave de unión: `item_id` (o dimensión de artículo). Sin llaves duplicadas. |
| `3_usuarios_por_user_id.csv` | Datos de usuario por User ID | Las columnas posteriores a `user_id` son propiedades de usuario: crea antes las dimensiones personalizadas de ámbito usuario (`segmento_rfm`, `clv_nivel`). **Nunca** subas correos, teléfonos ni nombres: usa un ID anónimo o con hash. |
| `3_usuarios_por_client_id.csv` | Datos de usuario por Client ID | Guarda `client_id` como **texto** (no como número) para que no se trunque. `stream_id` se consulta en Admin > Flujos de datos. |
| `4_eventos_fuera_de_linea.csv` | Datos de eventos (offline) | Requiere `client_id` (o `app_instance_id`), `measurement_id` (o `firebase_app_id`) y `event_name`. `timestamp_micros` debe caer entre los dos días calendario anteriores y hoy: **reemplaza el valor de ejemplo**. Nombres de evento: ≤ 40 caracteres, alfanuméricos y guion bajo, empezando con letra. |
| `5_eventos_personalizados_custom.csv` | Datos de eventos personalizados | Los nombres de columna son libres: se mapean a campos de GA4 (llaves: p. ej. ruta de página; campos a importar: dimensión personalizada de evento `categoria_contenido`, creada antes). No crea eventos nuevos. |

Todas las importaciones se hacen en **Admin > Recopilación y modificación de datos > Importación de datos** (se requiere rol de
Editor o superior en la propiedad). Los datos pueden tardar hasta 24 horas en aparecer.
