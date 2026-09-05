# Authentication MVP

## Scope

The MVP uses a per-company API key sent in the `x-api-key` request header for tenant/admin API access.

### Expected contract

- Missing `x-api-key` → `401`.
- Invalid `x-api-key` → `401`.
- Valid key for another company → `403` when accessing a company/project owned by a different tenant.
- Public showroom endpoints remain unauthenticated and read-only.

## Tenant isolation

Every admin operation that receives a `projectId` must verify that the project belongs to the authenticated company before reading or mutating project data. The client-provided project/company IDs are identifiers, not authorization credentials.

The authenticated company must come from the server-side lookup of `x-api-key`.

## Bootstrap / company provisioning

Company provisioning is a platform-level concern and should not be exposed as an unauthenticated tenant operation in the production architecture. Before the MVP is promoted beyond the demo, company creation/listing should use a separate platform bootstrap/admin credential or an authenticated platform operator flow.

## Legacy API

The `/api/companies` and `/api/projects` routes are legacy compatibility routes. They are not the target tenant API and must not be used by the production admin UI. They should be removed or explicitly isolated before the platform is exposed to real tenants.

## Post-demo hardening

The next security layer should add role-based authorization, API-key rotation/revocation, audit logging, rate limiting, and a proper authenticated operator/session model. The MVP API-key layer is intended to establish tenant isolation without changing the showroom experience.
