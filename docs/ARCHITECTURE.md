# REALESTATE — Arquitectura actual

## Producto

REALESTATE es una plataforma multiempresa para constructoras/desarrolladoras. Tiene tres superficies principales:

1. **Platform Owner** (`/platform`): visión global de empresas y proyectos.
2. **Company Workspace** (`/admin`, `/workspace`, `/cliente/:token`): administración de proyectos, inventario, contenido, publicación y acceso privado.
3. **Public Showroom** (`/proyecto/:slug`): experiencia comercial pública del proyecto.

## Producción

El flujo principal es:

`Browser → Vercel → api/[...path].js → Supabase Edge Function realestate-api → Supabase Postgres`

El proxy de Vercel utiliza una única Edge Function para el API principal. Las operaciones de unidades, incluido el acceso mediante `x-share-token`, ya no se envían a una función separada.

Assets y procesamiento asistido por IA utilizan sus Edge Functions especializadas.

## Autorización

- `x-platform-key`: operaciones globales del Platform Owner.
- `x-api-key`: operaciones de una constructora.
- `x-share-token`: acceso privado limitado a un proyecto y a los permisos incluidos en el enlace.

La autorización de proyecto siempre valida el tenant/proyecto correspondiente antes de leer o modificar datos.

## Modelo principal

`Company → Project → Building → Floor → Unit`

A esta jerarquía se conectan:

`Location`, `Plans`, `Amenities`, `Assets`, `Publication`, `Experience`, `Project Access Links`, `Leads` y `Content Ingestion Jobs`.

## Fuente de verdad

Supabase Postgres es la fuente de verdad para producción. El panel administrativo escribe mediante `realestate-api` y el showroom público consume el proyecto publicado desde la misma base de datos.

Un cambio comercial, como el precio o estado de una unidad, no debe duplicarse en el frontend del showroom.

## Desarrollo local

El repositorio mantiene partes de Express/SQLite para desarrollo y tests locales de compatibilidad. Esto no representa el runtime de producción.

Los tests de contrato de producción consultan la Edge Function real.

## Code splitting

`src/App.jsx` carga de forma diferida el panel administrativo y el showroom público para evitar que cada superficie cargue innecesariamente el código de la otra.

## Flujo de cambios

Los cambios nuevos se trabajan en ramas de feature/fix/chore, se validan y luego se integran a `main` mediante PR. Ver `docs/BRANCHING.md`.