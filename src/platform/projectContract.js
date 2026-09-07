export const PROJECT_CONTRACT_VERSION = '1.0';

export const PROJECT_ENTITY_GRAPH = Object.freeze([
  'company', 'project', 'location', 'building', 'floor', 'unit', 'plan', 'amenity', 'asset', 'publication', 'version', 'subscription', 'analytics', 'serviceRequest',
]);

export const PROJECT_REQUIRED_FOR_PUBLISH = [
  'name', 'slug', 'companyId', 'units', 'config', 'publication',
];

export function validateProjectContract(project = {}) {
  const errors = PROJECT_REQUIRED_FOR_PUBLISH.filter((field) => {
    const value = project[field];
    return value == null || value === '' || (Array.isArray(value) && value.length === 0);
  });
  return { valid: errors.length === 0, errors, version: PROJECT_CONTRACT_VERSION };
}

export function createProjectSnapshot(project = {}) {
  return {
    contractVersion: PROJECT_CONTRACT_VERSION,
    project: structuredCloneSafe(project),
    createdAt: new Date().toISOString(),
  };
}

function structuredCloneSafe(value) {
  return JSON.parse(JSON.stringify(value));
}
