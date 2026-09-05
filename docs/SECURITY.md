# Security

## Current posture: pre-demo minimal auth, still not production-ready

### Authentication and authorization
`/api/admin/*` (except the bootstrap `POST /api/admin/companies` and `GET /api/admin/companies`) and `/api/company/*` require an `x-api-key` header. The key is validated against the authenticated company, and company-scoped URL parameters must match that company. Missing or invalid keys return `401`; mismatches return `403`.

This is intentionally minimal API-key authentication for the demo, not a login system. `ensureCompanyAccess` remains only on the backwards-compatible `/api/auth/tenant-access` route.

### Exposure risks (still open)
- Bootstrap company routes are intentionally unauthenticated; anyone can list or create companies.
- Legacy write routes under `/api/*` remain available without authorization.
- Global `cors()` permits broad cross-origin access unless deployment infrastructure constrains it.
- The SQLite database is a local file under `server/data`; filesystem permissions, backup policy, and encryption are not defined.
- Error messages are returned directly from caught errors, which can expose implementation detail.
- Project-level admin routes are key-gated but do not yet re-check project ownership against the authenticated company.

### Existing protections
- Foreign keys are enabled in SQLite.
- Service methods validate several parent-child relationships and immutable unit ownership references.
- Public project lookup requires both published project state and published publication state.
- `/api/public/*` is intentionally exempt from the API-key requirement.

## Required future security sequence
1. Protect company bootstrap routes with real platform-admin authentication.
2. Replace flat API keys with a proper identity provider/session strategy and secret rotation.
3. Add project ownership checks to all `/api/admin/projects/*` routes.
4. Protect or retire legacy routes with a documented compatibility plan.
5. Restrict CORS to approved origins per environment.
6. Add audit logging, rate limits, and production secret/storage controls.
