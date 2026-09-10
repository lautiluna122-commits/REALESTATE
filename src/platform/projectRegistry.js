import { oceanMansionsProject } from '../data/projects/oceanMansions.js';

export const projectCatalog = [oceanMansionsProject];

export const projectRegistry = Object.fromEntries(
  projectCatalog.map((project) => [project.id, project]),
);

export function getProjectById(projectId = 'ocean-mansions') {
  return projectRegistry[projectId] ?? null;
}

export function getProjectByPublicSlug(publicSlug = 'ocean-mansions') {
  return projectCatalog.find((project) => project.publication?.publicSlug === publicSlug && project.publication?.isPublished && project.status === 'PUBLISHED') ?? null;
}

export function getProjectUnits(projectId = 'ocean-mansions') {
  const project = getProjectById(projectId);
  return Array.isArray(project?.units) ? project.units : [];
}

export function getProjectAmenities(projectId = 'ocean-mansions') {
  const project = getProjectById(projectId);
  return Array.isArray(project?.amenities) ? project.amenities : [];
}

export function getProjectLocation(projectId = 'ocean-mansions') {
  const project = getProjectById(projectId);
  return project?.location ?? null;
}

export function resolveProjectAsset(projectId = 'ocean-mansions', kind = 'glb') {
  const project = getProjectById(projectId);
  const realAsset = project?.assets?.buildingModel ?? project?.assets?.models?.[0] ?? null;

  if (realAsset && realAsset.kind === kind && typeof realAsset.path === 'string' && realAsset.path.length > 0) {
    return {
      ...realAsset,
      source: 'real-model',
      fallback: false,
    };
  }

  return {
    id: `asset-${projectId}-building-model`,
    name: `${project?.name ?? projectId} Building Model`,
    kind,
    path: `/assets/models/${projectId}.glb`,
    projectId,
    isPrimary: true,
    source: 'procedural-fallback',
    fallback: true,
  };
}
