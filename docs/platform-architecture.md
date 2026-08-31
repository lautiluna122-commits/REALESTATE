# Plataforma multi-proyecto de experiencias inmobiliarias 3D

## 1. Objetivo arquitectónico

La base de la plataforma no debe depender de un proyecto puntual ni de un renderer específico. El motor 3D se alimenta desde un mismo modelo de datos de proyecto y el showroom público consume esa misma fuente de verdad que usan los paneles internos.

## 2. Dominio central

El dominio está planteado con una capa de entidades compartidas:

- Company
- User
- Role
- Project
- Building
- Floor
- Unit
- Plan
- Amenity
- Asset
- Location
- ProjectPublication
- ProjectConfig

Estas entidades viven en `src/domain/platformModels.js` y representan la verdad de negocio, sin mezclarse con React ni con Three.js.

## 3. Multi-tenant y multi-proyecto

La plataforma está preparada para múltiples constructoras y proyectos.

- Cada `Company` tiene varios `Project`.
- Cada `Project` puede tener unidades, amenities, assets, locaización, configuración y publicación.
- La autorización separa roles por compañía y por alcance.
- El registrador de proyectos centraliza la carga del proyecto actual sin duplicar datos.

## 4. Roles

El sistema de permisos está definido en `src/platform/accessControl.js`:

- SUPER_ADMIN: acceso total.
- COMPANY_ADMIN: administra su compañía y proyectos.
- COMPANY_EDITOR: edición de contenidos restringidos.
- PUBLIC_VIEWER: solo lectura del showroom.

Esto permite crecer a nuevos roles sin acoplar la lógica a un único proyecto.

## 5. Experience Engine

La capa de experiencia vive en `src/experience/projectExperience.js`.

El flujo esperado es:

- cargar proyecto por `projectId`
- resolver datos del proyecto
- resolver assets del proyecto
- inicializar scene
- inicializar cámara
- inicializar iluminación
- inicializar interacción

Esto desacopla la experiencia del proyecto del propio motor gráfico.

## 6. Proyecto de prueba: Ocean Mansions

El primer proyecto cargado en la plataforma está definido en `src/data/projects/oceanMansions.js`.

No es el producto final; es el primer proyecto de prueba configurado para funcionar con el mismo motor de la plataforma.

## 7. Publicación / showroom externo

Cada proyecto puede tener una entidad de publicación con:

- `projectId`
- `publicSlug`
- `publicUrl`
- `title`
- `description`
- `thumbnail`
- `buttonText`
- `isPublished`
- `customDomain`

Esto deja la base lista para integrar la plataforma desde la web de la constructora sin cargar el motor 3D en la web de la constructora.

## 8. Regla de desacoplamiento

El showroom público no debe depender de un proyecto específico ni de un motor gráfico particular. La web externa sólo consume una URL pública, y el showroom carga el proyecto por slug o projectId.

## 9. Evolución visual

La arquitectura actual deja espacio para una transición hacia:

- Three.js
- Unreal Engine 5
- Pixel Streaming
- otro renderer

siempre que el `Project` siga siendo la fuente de verdad y no un modelo hardcodeado del showroom.

## 10. Siguiente nivel

Faltan las siguientes capas para llevarlo a producción:

- backend real con persistencia
- autenticación con sesiones / tokens
- gestión de permisos por registro y compañía
- CMS/admin panel para compañías
- panel de publicaciones y custom domains
- almacenamiento de assets y modelos 3D
- pipeline de GLB/BIM/planos
- public API para integraciones externas
- dashboards y seguimiento de disponibilidad en tiempo real
