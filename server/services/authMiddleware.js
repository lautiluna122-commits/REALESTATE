import { getSessionUser } from './authService.js';
import { TENANT_ROLE, canMutate, sameTenant } from '../../src/platform/tenantModel.js';

function bearerToken(req) {
  const header = req.get('authorization') || '';
  return header.startsWith('Bearer ') ? header.slice(7).trim() : null;
}

export function requireAuth(req, res, next) {
  const user = getSessionUser(bearerToken(req));
  if (!user) return res.status(401).json({ message: 'Authentication required' });
  req.auth = user;
  next();
}

export function requireSuperAdmin(req, res, next) {
  if (!req.auth) return requireAuth(req, res, next);
  if (req.auth.role !== TENANT_ROLE.SUPER_ADMIN) return res.status(403).json({ message: 'Super admin access required' });
  next();
}

export function requireCompanyAccess(resource = null) {
  return (req, res, next) => {
    if (!req.auth) return requireAuth(req, res, next);
    if (req.auth.role === TENANT_ROLE.SUPER_ADMIN) return next();
    const companyId = req.params.companyId;
    if (!companyId || !sameTenant(req.auth.companyId, companyId)) return res.status(403).json({ message: 'Tenant access denied' });
    if (req.method !== 'GET' && req.method !== 'HEAD' && resource && !canMutate(req.auth.role, resource)) {
      return res.status(403).json({ message: `Role ${req.auth.role} cannot mutate ${resource}` });
    }
    next();
  };
}

export function requirePlatformAdmin(req, res, next) {
  return requireSuperAdmin(req, res, next);
}

export function requireAuthenticatedLegacyMutation(req, res, next) {
  return requireAuth(req, res, next);
}

export function authUserFromRequest(req) {
  return req.auth ?? getSessionUser(bearerToken(req));
}
