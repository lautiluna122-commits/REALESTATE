// Static demo data is used only as a resilient local/public fallback. Published projects are hydrated from the API.
import { oceanMansionsProject } from '../data/projects/oceanMansions.js';

export { oceanMansionsProject };

export const projectCatalog = [oceanMansionsProject];

export const projectRegistry = Object.fromEntries(
  projectCatalog.map((project) => [project.id, project]),
);

export function getProjectById(projectId) {
  if (!projectId) return null;
  return projectRegistry[projectId] ?? null;
}

export function getProjectByPublicSlug(publicSlug) {
  if (!publicSlug) return null;
  return projectCatalog.find((project) => project.publication?.publicSlug === publicSlug && project.publication?.isPublished && project.status === 'PUBLISHED') ?? null;
}

export function hydratePublishedProject(payload) {
  const source = payload?.project;
  if (!source?.id) return null;

  const rawBuildings = Array.isArray(payload.buildings) ? payload.buildings : [];
  const rawFloors = Array.isArray(payload.floors) ? payload.floors : [];
  const buildingById = new Map(rawBuildings.map((building) => [String(building.id), building]));
  const floorById = new Map(rawFloors.map((floor) => [String(floor.id), floor]));

  // The production API returns relational IDs (buildingId/floorId), while the
  // showroom renderer works with the human-readable building/floor values.
  // Normalize both API and local/demo shapes here so every published project
  // follows the same contract.
  const units = (Array.isArray(payload.units) ? payload.units : []).map((unit) => {
    const floor = floorById.get(String(unit.floorId ?? unit.floorid ?? unit.floor?.id ?? ''));
    const building = buildingById.get(String(unit.buildingId ?? unit.buildingid ?? unit.building?.id ?? ''));
    return {
      ...unit,
      projectId: unit.projectId ?? unit.projectid ?? source.id,
      buildingId: unit.buildingId ?? unit.buildingid ?? unit.building?.id ?? null,
      floorId: unit.floorId ?? unit.floorid ?? unit.floor?.id ?? null,
      building: unit.building ?? building?.name ?? building?.reference ?? '',
      floor: unit.floor ?? floor?.number ?? unit.floorNumber ?? null,
      status: unit.status ?? 'AVAILABLE',
      images: Array.isArray(unit.images) ? unit.images : [],
    };
  });

  const project = {
    ...source,
    publication: payload.publication ?? source.publicationConfig ?? null,
    buildings: rawBuildings,
    floors: rawFloors,
    units,
    plans: Array.isArray(payload.plans) ? payload.plans : [],
    amenities: Array.isArray(payload.amenities) ? payload.amenities : [],
    assets: Array.isArray(payload.assets) ? payload.assets : [],
    location: payload.location ?? source.location ?? null,
    config: source.environmentConfig ?? source.config ?? {},
  };

  projectRegistry[project.id] = project;
  if (!projectCatalog.some((item) => item.id === project.id)) projectCatalog.push(project);
  return project;
}

export function getProjectUnits(projectId) {
  const project = getProjectById(projectId);
  return Array.isArray(project?.units) ? project.units : [];
}

export function getProjectAmenities(projectId) {
  const project = getProjectById(projectId);
  return Array.isArray(project?.amenities) ? project.amenities : [];
}

export function getProjectLocation(projectId) {
  const project = getProjectById(projectId);
  return project?.location ?? null;
}

export function resolveProjectAsset(projectId, kind = 'glb') {
  const project = getProjectById(projectId);
  if (!project) return null;
  const assets = Array.isArray(project.assets) ? project.assets : [];
  const realAsset = assets.find((asset) => asset.kind === kind && (asset.entityType === 'PROJECT' || asset.entityId === projectId)) ?? assets.find((asset) => asset.kind === kind) ?? null;

  if (realAsset && typeof realAsset.path === 'string' && realAsset.path.length > 0) {
    return { ...realAsset, source: 'real-model', fallback: false };
  }

  return {
    id: `asset-${projectId}-building-model`,
    name: `${project.name ?? projectId} Building Model`,
    kind,
    path: `/assets/models/${projectId}.glb`,
    projectId,
    isPrimary: true,
    source: 'procedural-fallback',
    fallback: true,
  };
}
