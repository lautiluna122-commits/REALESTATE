# Security

## Current posture: development/prototype, not production-ready

### Authentication and authorization
No request authentication exists. The API does not validate credentials, sessions, JWTs, OAuth tokens, API keys, or cookies. The `users` table and frontend permission matrix are not connected to HTTP authorization.

`ensureCompanyAccess(requestedCompanyId, targetCompanyId)` only compares two caller-controlled IDs. It must not be treated as an authorization mechanism.

### Exposure risks
- `/api/admin/*` has no access control despite its intended administrative purpose.
- Company routes take `companyId` from the URL and do not establish a caller identity.
- Legacy write routes under `/api/*` remain available without authorization.
- Global `cors()` permits broad cross-origin access unless deployment infrastructure constrains it.
- The SQLite database is a local file under `server/data`; filesystem permissions, backup policy, and encryption are not defined.
- Error messages are returned directly from caught errors, which can expose implementation detail.

### Existing protections
- Foreign keys are enabled in SQLite.
- Service methods validate several parent-child relationships and immutable unit ownership references.
- Public project lookup requires both published project state and published publication state.

## Required future security sequence
1. Define identity provider/session strategy and secret handling.
2. Add authentication middleware that produces a trusted actor context.
3. Implement role + tenant authorization centrally; never trust client tenant IDs.
4. Protect or retire legacy routes with a documented compatibility plan.
5. Restrict CORS to approved origins per environment.
6. Add route-level authorization, negative tests, audit logging, rate limits, validation, and production secret/storage controls.

No authentication implementation is included in this documentation-only change.
