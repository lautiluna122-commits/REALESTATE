import { oceanMansionsProject } from '../data/projects/oceanMansions.js';

export const projectCatalog = [oceanMansionsProject];

export const projectRegistry = Object.fromEntries(
  projectCatalog.map((project) => [project.id, project]),
);

export function getProjectById(projectId = 'ocean-mansions') {
  return projectRegistry[projectId] ?? projectCatalog[0];
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
  return project?.location ?? {
    id: 'location-punta-del-este',
    name: 'Punta del Este',
    district: 'Playa Mansa',
    city: 'Punta del Este',
    country: 'Uruguay',
    coordinates: { lat: -34.9, lng: -54.9 },
  };
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
    id: 'asset-ocean-building-model',
    name: 'Ocean Mansions Building Model',
    kind,
    path: '/assets/models/ocean-mansions.glb',
    projectId,
    isPrimary: true,
    source: 'procedural-fallback',
    fallback: true,
  };
}
