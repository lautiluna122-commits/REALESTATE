# REALESTATE — Final product architecture

## Product
A reusable digital property showroom for construction companies and real-estate developers. The product is not a one-off Ocean Mansions website: Ocean Mansions is the reference demo tenant.

## Canonical hierarchy
Company → Project → Building → Floor → Unit

Project-level resources:
- plans
- assets
- amenities
- location
- publication
- leads
- environment / experience configuration
- branding

The database/domain model is the source of truth. The 3D renderer is a presentation layer only.

## Product surfaces

### 1. Public showroom
`/proyecto/:publicSlug`

Purpose: convert interest into a qualified inquiry.

Core journey:
1. project hero / location
2. interactive building
3. floor selection
4. unit selection
5. unit commercial detail
6. plans / interiors / amenities
7. location
8. contact / lead capture

Only published data is exposed publicly.

### 2. Company workspace
Authenticated tenant surface for a constructor/developer.

The client manages its own projects and commercial information without touching renderer code.

Required management areas:
- project identity and branding
- building and floors
- inventory and unit status/pricing
- plans and media assets
- amenities
- location
- publication
- leads

### 3. Platform layer
Internal administration and future multi-tenant controls.

Authentication and authorization remain separate. A company ID supplied by a browser is never considered proof of access.

## Commercial operating process

### Project onboarding
1. Create company.
2. Create project.
3. Configure building/floors.
4. Import or create units.
5. Attach plans, imagery and 3D assets.
6. Configure branding and location.
7. Preview showroom.
8. Validate inventory and legal/commercial content.
9. Publish.

### Ongoing operation
The constructor changes prices, availability, descriptions and project content in the source-of-truth data. The public showroom consumes the published projection; no manual recreation of the website is required.

### Publication rule
Draft → Preview → Published → Unpublished.

Publishing is an explicit action. Unpublishing immediately removes the project from public discovery and public project resolution while preserving the project data.

## Productization model

One platform, many projects.

Recommended commercial structure:
- implementation/setup fee per project
- recurring maintenance/platform fee
- optional premium work for custom 3D scenes, integrations and content production

The architecture must make the implementation repeatable: onboarding a second project should be data/configuration work, not a new application fork.

## Renderer contract
The renderer receives project experience data and must not own business rules. A future renderer can replace Three.js without changing the Company → Project → Building → Floor → Unit model.

## Current reference stack
- React + Vite
- React Three Fiber + Three.js
- Express API
- SQLite for the current prototype/platform foundation

Do not replace the stack merely for style. A production persistence/hosting decision can be made later when the first paying implementation requires it.

## Definition of done for the first commercial demo

- Public showroom feels premium and architectural, not like an admin prototype.
- Project data is separated from renderer presentation.
- Inventory is selectable and commercially legible.
- Contact/lead capture works.
- Project management model supports multiple companies and projects.
- Tenant boundaries are tested.
- Published vs draft visibility is tested.
- Build and API tests pass in CI.
- Demo can be shown to a construction company without explaining the codebase.
