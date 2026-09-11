// Static demo data is kept only as a fallback fixture. Published projects should be hydrated from the API.
import { oceanMansionsProject } from '../data/projects/oceanMansions.js';

export const projectCatalog = import.meta.env.VITE_ENABLE_DEMO_PROJECTS === 'true' ? [oceanMansionsProject] : [];

export const projectRegistry = Object.fromEntries(
  projectCatalog.map((project) => [project.id, project]),
);

export function getProjectById(projectId = 'ocean-mansions') {
  return projectRegistry[projectId] ?? null;
}

export function getProjectByPublicSlug(publicSlug = 'ocean-mansions') {
  return projectCatalog.find((project) => project.publication?.publicSlug === publicSlug && project.publication?.isPublished && project.status === 'PUBLISHED') ?? null;
}

export function hydratePublishedProject(payload) {
  const source = payload?.project;
  if (!source?.id) return null;

  const project = {
    ...source,
    publication: payload.publication ?? source.publicationConfig ?? null,
    buildings: Array.isArray(payload.buildings) ? payload.buildings : [],
    floors: Array.isArray(payload.floors) ? payload.floors : [],
    units: Array.isArray(payload.units) ? payload.units : [],
    plans: Array.isArray(payload.plans) ? payload.plans : [],
    amenities: Array.isArray(payload.amenities) ? payload.amenities : [],
    assets: Array.isArray(payload.assets) ? payload.assets : [],
    location: payload.location ?? source.location ?? null,
  };

  projectRegistry[project.id] = project;
  if (!projectCatalog.some((item) => item.id === project.id)) projectCatalog.push(project);
  return project;
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
  const assets = Array.isArray(project?.assets) ? project.assets : [];
  const realAsset = assets.find((asset) => asset.kind === kind && (asset.entityType === 'PROJECT' || asset.entityId === projectId)) ?? assets.find((asset) => asset.kind === kind) ?? null;

  if (realAsset && typeof realAsset.path === 'string' && realAsset.path.length > 0) {
    return { ...realAsset, source: 'real-model', fallback: false };
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
