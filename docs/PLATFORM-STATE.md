# REALESTATE platform readiness

## Current integration target
The repository is being treated as one product with four surfaces: Studio, Client Portal, Showroom and Embed. The published manifest is the contract between platform data and the public renderer.

## Verified in source
- Lifecycle state machine exists and rejects invalid transitions.
- Project versions are persisted in SQLite.
- Public manifest route aggregates project, buildings, floors, units, plans, amenities, assets and location.
- Client inventory routes enforce project/company matching at the route level.
- Analytics events are persisted and aggregated.
- Studio has a server synchronization path with local fallback.
- Showroom has a published-manifest hydration bridge.
- A master audit prompt exists at `docs/MASTER-AGENT-PROMPT.md`.

## Not yet production-ready
- Authentication and server-side identity/RBAC are not implemented.
- Upload binaries are not persisted to durable object storage by Studio; browser metadata is currently used by the ingestion prototype.
- SQLite is suitable for the current integration prototype, not final multi-tenant production infrastructure.
- The public API must be audited for safe-field exposure before external launch.
- Deployment/build/browser verification must be run in an environment with repository execution access.

## Release gate
Do not call the platform production-ready until the P0 integration test, build, browser smoke test, auth/tenant isolation and durable asset storage are green.
