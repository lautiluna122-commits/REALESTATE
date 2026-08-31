import { ROLE } from '../domain/platformModels';

export const permissionsMatrix = {
  [ROLE.SUPER_ADMIN]: ['*'],
  [ROLE.COMPANY_ADMIN]: ['project:read', 'project:write', 'project:publish', 'unit:write', 'content:write'],
  [ROLE.COMPANY_EDITOR]: ['project:read', 'unit:write', 'content:write'],
  [ROLE.PUBLIC_VIEWER]: ['project:read', 'showroom:read'],
};

export function hasPermission(userRole, permission) {
  const permissions = permissionsMatrix[userRole] ?? [];
  return permissions.includes('*') || permissions.includes(permission);
}

export function canAccessProject(userRole, projectCompanyId, requestedCompanyId) {
  if (userRole === ROLE.SUPER_ADMIN) {
    return true;
  }

  return projectCompanyId === requestedCompanyId;
}

export const platformUsers = {
  superAdmin: {
    id: 'user-super-admin',
    name: 'Super Admin',
    email: 'admin@platform.local',
    role: ROLE.SUPER_ADMIN,
  },
  companyAdmin: {
    id: 'user-company-admin',
    name: 'Company Admin',
    email: 'admin@company.local',
    role: ROLE.COMPANY_ADMIN,
  },
  publicViewer: {
    id: 'user-public-viewer',
    name: 'Public Viewer',
    email: 'viewer@public.local',
    role: ROLE.PUBLIC_VIEWER,
  },
};
