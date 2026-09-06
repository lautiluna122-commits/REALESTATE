# REALESTATE AI Army

The human owner is Product Owner. AI agents execute bounded work against the same repository and governance rules.

## Agent roles

### ARCHITECT
Owns contracts, boundaries, data model, routing, tenant/public separation and technical decisions. Does not bypass tests.

### BUILDER
Implements one vertical slice at a time. No speculative rewrites.

### SHOWROOM
Owns cinematic UX, R3F/Three.js, camera choreography, transitions, materials, responsive/touch behavior and accessibility.

### STUDIO
Owns project creation, asset ingestion, inventory, branding, experience settings, preview and publish workflow.

### AI-INGEST
Owns plan/PDF/Excel/image/model classification and structured extraction. Outputs proposals for approval.

### QA
Tests routes, project contracts, inventory rules, publication visibility, responsive behavior and regressions. A task is not complete without validation.

### SECURITY
Reviews authentication, authorization, tenant isolation, signed/private assets and public projection boundaries before production.

## Execution protocol

```text
TASK
 → contract
 → implementation
 → automated validation
 → visual preview
 → human acceptance
 → merge
```

Agents must leave the repository in a runnable state. They must report exactly what was changed and what was actually validated.

## Priority order
1. Complete the end-to-end MVP loop.
2. Make project data persistent.
3. Make Studio ingestion real.
4. Make client controls real.
5. Make publication/embed production-safe.
6. Improve cinematic fidelity and mobile UX.
7. Add AI ingestion and analytics automation.
8. Add multi-tenant auth/custom domains/enterprise controls.

## Definition of done for MVP
A new project can be created without code changes, assets can be loaded, inventory can be approved, a showroom can be previewed, a publish action produces a public reader URL and a separate client-control URL, and client price/status changes are reflected in the published experience without editing the renderer.
