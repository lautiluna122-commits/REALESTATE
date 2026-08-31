# Roadmap

This roadmap records intended sequencing; it does not authorize premature implementation.

| Phase | Status | Outcome |
| --- | --- | --- |
| 1. Backend/data integrity | Done | SQLite persistence, hierarchy checks, tenant-oriented service validation, and API integrity tests. |
| 2. Project Management Core | Current | Stabilize canonical data contracts, project CRUD boundaries, documentation, and governance. |
| 3. Internal Admin Platform | Planned | Authenticated platform UI for company/project/content administration. |
| 4. Company/Developer Portal | Planned | Tenant-scoped editor workflows and role-aware permissions. |
| 5. Asset & Plan Management | Planned | Managed metadata, upload/storage abstraction, asset lifecycle, and plan associations. |
| 6. Public Project / Showroom | Planned | API-backed public routes, publication controls, and public projections. |
| 7. Experience Engine 3D | Planned | Renderer DTO, asset loading, interaction model, performance budgets. |
| 8. High-quality 3D asset pipeline | Planned | GLB/BIM/texture validation, optimization, and authoring workflow. |
| 9. Geospatial/environment integration | Planned | Map/geographic data and project environment layers. |
| 10. Advanced immersive experience | Planned | Evaluate Unreal/Pixel Streaming only behind a renderer-independent contract. |
| 11. Scalable infrastructure | Planned | Managed database, object storage, CDN, observability, backups, and deployment controls. |

## Recommended next task
Design and implement a minimal **authenticated actor context and centralized authorization boundary** for the API, beginning with a written ADR and tests. It must use a trusted identity source, scope every tenant query/mutation by that actor, and include a compatibility plan for legacy routes. Do not begin the admin UI or external identity-provider integration until that boundary is agreed.
