# Data Model

## Canonical hierarchy

```text
Company
└── Project
    └── Building
        └── Floor
            └── Unit

Project resources: Plan, Asset, Amenity, Location, ProjectPublication
```

## Persisted entities
SQLite currently defines:
- **companies**: identity, name, slug, status, creation time.
- **users**: company association, identity fields, role and status. The table is reserved for future identity/authorization work and is not used by the request flow today.
- **projects**: tenant-owned project data and JSON configuration fields.
- **buildings**, **floors**, **units**: inventory hierarchy.
- **plans**, **assets**, **amenities**, **locations**: project resources.
- **project_publications**: one publication record per project, including public slug, URL, status, and visibility.

## Integrity currently enforced
- A project slug is unique per company.
- Floors must use a building that belongs to their project.
- Units must use a building and floor that belong to their project.
- Unit project/building/floor references are immutable during update.
- A publicly listed/resolved project must be both `PUBLISHED` and have a publication marked `isPublished`.
- Service-level validation prevents duplicate public slugs within a company.

## Important gap
The database has no database-level unique constraint for `(companyId, publicSlug)`; uniqueness is presently enforced in service code. It also has no authenticated principal-to-user/role model. Future migrations must preserve existing data and should add database constraints only after resolving the desired global public URL namespace: a public lookup by slug alone cannot distinguish equal slugs from separate companies.

## Frontend model
`src/domain/platformModels.js` and `src/data/projects/oceanMansions.js` provide a parallel in-memory model used by the demo showroom. This is useful as a prototype but is not yet a canonical, API-backed model.
