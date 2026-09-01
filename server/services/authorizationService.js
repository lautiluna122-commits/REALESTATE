// Deliberately identity-provider agnostic. Future authentication must construct a trusted actor
// before calling this boundary; request body/path values alone never establish identity.
export function createAuthorizationContext(actor = null) {
  return { actorId: actor?.id ?? null, companyId: actor?.companyId ?? null, role: actor?.role ?? null };
}
export function assertProjectOwnership(project, expectedCompanyId) {
  if (!project) throw new Error('Project not found');
  if (expectedCompanyId && project.companyId !== expectedCompanyId) throw new Error('Project is outside tenant scope');
  return project;
}
export function assertScopedResource(resource, projectId) {
  if (!resource || resource.projectId !== projectId) throw new Error('Resource is outside project scope');
  return resource;
}
