import test from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';

const { createCompany } = await import('../services/projectService.js');
const { createUser, authenticateUser, createSession, getSessionUser, revokeSession } = await import('../services/authService.js');
const { TENANT_ROLE } = await import('../../src/platform/tenantModel.js');

function uniqueEmail(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@test.local`;
}

test('authentication creates a user, validates credentials and issues a session', () => {
  const company = createCompany({ name: 'Auth Tenant', slug: `auth-${Date.now()}` });
  const email = uniqueEmail('admin');
  const user = createUser({ companyId: company.id, name: 'Company Admin', email, password: 'correct-password', role: TENANT_ROLE.COMPANY_ADMIN });

  assert.equal(authenticateUser(email, 'wrong-password'), null);
  const authenticated = authenticateUser(email, 'correct-password');
  assert.equal(authenticated.id, user.id);
  assert.equal(authenticated.companyId, company.id);
  assert.equal(authenticated.role, TENANT_ROLE.COMPANY_ADMIN);

  const session = createSession(user.id);
  assert.ok(session.token);
  assert.ok(session.expiresAt);
  assert.equal(getSessionUser(session.token).id, user.id);

  revokeSession(session.token);
  assert.equal(getSessionUser(session.token), null);
});

test('super admin can exist without a company while tenant roles require a company', () => {
  const email = uniqueEmail('super');
  const user = createUser({ name: 'Owner', email, password: 'owner-password', role: TENANT_ROLE.SUPER_ADMIN });
  assert.equal(user.companyId, null);
  assert.throws(
    () => createUser({ name: 'Broken', email: uniqueEmail('broken'), password: 'password', role: TENANT_ROLE.COMPANY_EDITOR }),
    /companyId is required/i,
  );
});
