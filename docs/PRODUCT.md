# Product

## Purpose
REALESTATE is a multi-tenant platform for managing and publishing digital real-estate experiences. It serves three distinct audiences from one canonical project model:

1. **Platform admin** manages companies, users, project configuration, content, and publication.
2. **Company portal** lets a developer manage only the projects and content it is authorized to manage.
3. **Public showroom** presents published projects read-only through a stable public URL.

The first Ocean Mansions experience is a demonstration dataset, not a product boundary or a reusable implementation pattern.

## Product principles
- A project database/model is the source of truth for administrative, company, and public experiences.
- Publication is an explicit layer over a project; it is not a duplicate public database.
- Public viewers may read only published content.
- The experience engine consumes project data and assets; it does not own pricing, availability, inventory, or publication state.
- The platform must support many companies and projects without project-specific code.

## Current capabilities
The backend persists companies, projects, buildings, floors, units, plans, assets, amenities, locations, and publications in SQLite. It enforces several hierarchical integrity rules and separates administrative, company-prefixed, public, and legacy HTTP routes.

The frontend is a single React/Vite showroom prototype. It renders an Ocean Mansions-oriented Three.js scene with local data and interactive unit/floor UI.

## Out of scope for the current phase
Authentication, file storage, production CDN, external mapping, photogrammetry, Unreal integration, and a redesign of the 3D renderer are not implemented by this governance phase.
