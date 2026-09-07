export const PROJECT_STATUS = Object.freeze({
  DRAFT: 'DRAFT',
  PROCESSING: 'PROCESSING',
  REVIEW: 'REVIEW',
  APPROVED: 'APPROVED',
  PUBLISHED: 'PUBLISHED',
  ARCHIVED: 'ARCHIVED',
});

export const PROJECT_STAGE = Object.freeze({
  CREATE: 'create',
  INGEST: 'ingest',
  VALIDATE: 'validate',
  GENERATE: 'generate',
  REVIEW: 'review',
  APPROVE: 'approve',
  PUBLISH: 'publish',
  OPERATE: 'operate',
});

export const ACCESS_SURFACE = Object.freeze({
  STUDIO: 'studio',
  CLIENT: 'client',
  SHOWROOM: 'showroom',
  EMBED: 'embed',
});

export const PROJECT_CAPABILITIES = Object.freeze([
  'content', 'inventory', 'buildings', 'floors', 'units', 'plans', 'amenities', 'locations',
  'branding', 'experience', 'publication', 'analytics', 'service', 'billing', 'versions',
]);

export function getProjectAccessSurface(pathname = '') {
  if (pathname.startsWith('/studio')) return ACCESS_SURFACE.STUDIO;
  if (pathname.startsWith('/cliente/')) return ACCESS_SURFACE.CLIENT;
  if (pathname.startsWith('/embed/')) return ACCESS_SURFACE.EMBED;
  return ACCESS_SURFACE.SHOWROOM;
}

export function isReadOnlySurface(surface) {
  return surface === ACCESS_SURFACE.SHOWROOM || surface === ACCESS_SURFACE.EMBED;
}
