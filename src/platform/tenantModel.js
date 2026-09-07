export const TENANT_ROLE = Object.freeze({
  SUPER_ADMIN: 'SUPER_ADMIN',
  COMPANY_ADMIN: 'COMPANY_ADMIN',
  COMPANY_EDITOR: 'COMPANY_EDITOR',
  SALES: 'SALES',
  VIEWER: 'VIEWER',
  PUBLIC: 'PUBLIC',
});

export const TENANT_MUTATIONS = Object.freeze({
  COMPANY_ADMIN: ['project', 'inventory', 'content', 'branding', 'experience', 'publication', 'users', 'analytics', 'service'],
  COMPANY_EDITOR: ['inventory', 'content'],
  SALES: ['inventory'],
  VIEWER: [],
  PUBLIC: [],
});

export function isTenantScoped(role) { return role !== TENANT_ROLE.SUPER_ADMIN && role !== TENANT_ROLE.PUBLIC; }
export function canMutate(role, resource) { return TENANT_MUTATIONS[role]?.includes(resource) ?? role === TENANT_ROLE.SUPER_ADMIN; }
export function sameTenant(actorCompanyId, resourceCompanyId) { return Boolean(actorCompanyId && resourceCompanyId && actorCompanyId === resourceCompanyId); }
