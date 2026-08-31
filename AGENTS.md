# REALESTATE Engineering Governance

## Scope and source of truth
- Treat the canonical project model and persisted project data as the product source of truth.
- Never make Three.js, Unreal, a scene, or a renderer the source of truth for business data.
- Never hard-code a specific project, company, unit, location, asset, or public slug into reusable platform code.
- Keep the canonical hierarchy: Company → Project → Building → Floor → Unit. Project resources include plans, assets, amenities, location, and publication.

## Tenant and public boundaries
- Preserve tenant isolation in every query, mutation, route, and test. A client-supplied company ID is not proof of authorization.
- Keep authentication (who is acting) separate from authorization (what they can do).
- Public endpoints must expose published projections only. Do not resolve private projects through public APIs.
- Maintain project/publication separation; do not create a copied public database.

## Change discipline
- Work on a branch and use a pull request for isolatable features; do not modify main directly.
- Do not replace React, Vite, Express, SQLite, or the current renderer without an approved architectural decision.
- Avoid new dependencies unless their value, ownership, and operational cost are documented.
- Preserve compatibility intentionally. When it must change, document the migration and add coverage.
- Do not rewrite working code merely for style. Keep commits focused and avoid unrelated changes.
- Document significant decisions in docs/ and update relevant documents when the architecture changes.

## Validation
- Add tests for business rules, tenant boundaries, publication visibility, and regressions.
- After backend changes, run `npm run test:api`.
- Before declaring a task complete, run `npm run build`.
- Report changed files and exact validation results. Stop when the assigned task is complete; do not invent follow-up scope.
