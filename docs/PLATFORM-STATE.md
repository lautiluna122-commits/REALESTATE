# REALESTATE platform readiness

## Current integration target
The repository is being treated as one product with four surfaces: Studio, Client Portal, Showroom and Embed. The published manifest is the contract between platform data and the public renderer.

## Verified in source
- Lifecycle state machine exists and rejects invalid transitions.
- Project versions are persisted in SQLite.
- Publication is now gated by an APPROVED project plus an APPROVED version in the platform lifecycle router.
- Public manifest is served only for published projects and is normalized to a public-safe project shape.
- Public analytics accepts only known showroom events and only for published projects.
- Client inventory routes enforce project/company matching at the route level.
- Analytics events are persisted and aggregated.
- Studio has a server synchronization path with local fallback.
- Public renderer loading now waits for the backend manifest before importing the cinematic renderer, avoiding the previous module-import/localStorage hydration race.
- Obsolete `PublicManifestBridge.jsx` was removed after the loader replaced its responsibility.
- A master audit prompt exists at `docs/MASTER-AGENT-PROMPT.md`.

## Not yet production-ready
- Authentication and server-side identity/RBAC are not implemented.
- Upload binaries are not persisted to durable object storage by Studio; browser metadata is currently used by the ingestion prototype.
- SQLite is suitable for the current integration prototype, not final multi-tenant production infrastructure.
- Public assets/units still need a final field-level privacy audit before external launch.
- Deployment/build/browser verification has not been run in this environment.
- The working branch is behind `main`; this must be reconciled before treating it as the final release branch.

## Release gate
Do not call the platform production-ready until the P0 integration test, build, browser smoke test, auth/tenant isolation, durable asset storage and final public-data audit are green.
