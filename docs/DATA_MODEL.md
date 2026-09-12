# REALESTATE — Modelo de datos actual

## Jerarquía

`companies → projects → buildings → floors → units`

Cada registro de proyecto pertenece a una compañía y los recursos de estructura se escopan por proyecto.

## Recursos complementarios

- `locations`: ubicación del proyecto.
- `plans`: planos asociados al proyecto.
- `amenities`: amenities y características comunes.
- `assets`: imágenes, renders, modelos, tours, vídeos y documentos.
- `project_publications`: slug público, estado y configuración de publicación.
- `project_experience_configs`: configuración de la experiencia visual/3D.
- `project_access_links`: enlaces privados para operación de cliente.
- `leads`: consultas generadas por el showroom.
- `content_ingestion_jobs`: trabajos de ingreso asistido por IA.

## Unit

Una unidad contiene identificador, edificio, piso, número, superficie, dormitorios, baños, terraza, precio, moneda, estado, descripción, plano, referencia de modelo e imágenes.

Estados comerciales: `AVAILABLE`, `RESERVED`, `SOLD`, `HIDDEN`.

Monedas soportadas: `USD`, `UYU`, `ARS`, `EUR`.

## Fuente de verdad

Producción utiliza Supabase Postgres. El workspace modifica datos a través de `realestate-api`; el showroom consume el mismo proyecto publicado. No se deben mantener precios, estados o inventario duplicados en archivos del frontend.