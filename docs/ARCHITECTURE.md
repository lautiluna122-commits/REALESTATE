# Architecture

## Current system

```text
React/Vite showroom prototype
  ├─ src/data/projects/oceanMansions.js
  ├─ src/platform/projectRegistry.js
  └─ src/App.jsx (React Three Fiber scene + UI)

Express API
  ├─ server/index.js (HTTP routes)
  ├─ server/services/projectService.js (business/data rules)
  └─ server/db.js (SQLite schema, connection, seed)
```

The frontend and backend currently contain overlapping domain representations. The backend is the persistence layer intended to become canonical; the frontend still obtains the rendered project from local demo modules. They are not integrated by HTTP yet.

## Backend route boundary
- `/api/admin/*`: intended platform management surface; currently unauthenticated.
- `/api/company/:companyId/*`: tenant-oriented read surface; currently trusts the URL identity.
- `/api/public/*`: published, read-only project discovery/resolution.
- Legacy `/api/*`: compatibility routes; currently duplicate several operations and are unauthenticated.

## Intended target direction
A future authenticated request should establish an actor once, then authorization should derive tenant and role from that actor. Services and queries must scope access by the authorized tenant rather than accepting a tenant identifier as proof. Public resolution should use a dedicated publication lookup and return an intentionally public projection.

The renderer should receive a stable project/experience DTO produced from the same canonical project data. It must not require duplicated, hand-maintained project facts.

## Architectural decisions recorded
- Keep the existing React/Vite, Express, SQLite, and Three.js stack for this phase.
- Preserve publication as a separate entity from a project.
- Do not merge demo frontend data into the backend or introduce authentication during this documentation task.
- Treat removal or migration of legacy routes as a future, deliberate compatibility decision.
