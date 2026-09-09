import crypto from 'node:crypto';
import { getDb } from '../db.js';
import { listProjectAssets } from './projectService.js';
import { validateProjectIntegrity } from './projectIntegrityService.js';

const UE5_KINDS = new Set([
  'buildingModel',
  'floorModel',
  'unitModel',
  'exteriorRender',
  'interiorRender',
  'panorama360',
  'video',
  'environment',
]);

function parseJson(value, fallback = {}) {
  if (!value) return fallback;
  try { return JSON.parse(value); } catch { return fallback; }
}

function normalizeAsset(asset) {
  const metadata = asset.metadata ?? {};
  return {
    id: asset.id,
    name: asset.name,
    kind: asset.kind,
    entityType: asset.entityType ?? null,
    entityId: asset.entityId ?? null,
    url: asset.url ?? null,
    path: asset.path ?? null,
    mimeType: asset.mimeType ?? null,
    status: asset.path || asset.url ? 'READY' : 'PENDING',
    metadata,
    unreal: {
      enabled: UE5_KINDS.has(asset.kind),
      sourceUrl: asset.url ?? null,
      importPath: metadata.unrealImportPath ?? `Content/REALESTATE/Projects/${asset.projectId}/${asset.kind}/${asset.name}`,
      assetRole: metadata.unrealRole ?? asset.kind,
    },
  };
}

export function getUnrealProjectManifest(projectId) {
  const db = getDb();
  const project = db.prepare('SELECT * FROM projects WHERE id = ? LIMIT 1').get(projectId);
  if (!project) return null;

  const buildings = db.prepare('SELECT * FROM buildings WHERE projectId = ? ORDER BY createdAt ASC').all(projectId);
  const floors = db.prepare('SELECT * FROM floors WHERE projectId = ? ORDER BY number ASC, createdAt ASC').all(projectId);
  const units = db.prepare('SELECT * FROM units WHERE projectId = ? ORDER BY floorId ASC, number ASC').all(projectId);
  const plans = db.prepare('SELECT * FROM plans WHERE projectId = ? ORDER BY createdAt ASC').all(projectId);
  const amenities = db.prepare('SELECT * FROM amenities WHERE projectId = ? ORDER BY createdAt ASC').all(projectId);
  const location = db.prepare('SELECT * FROM locations WHERE projectId = ? ORDER BY createdAt ASC LIMIT 1').get(projectId) ?? null;
  const assets = listProjectAssets(projectId).filter((asset) => UE5_KINDS.has(asset.kind)).map(normalizeAsset);

  return {
    schemaVersion: '1.0',
    generatedAt: new Date().toISOString(),
    exportId: crypto.randomUUID(),
    engine: { name: 'Unreal Engine', majorVersion: 5, integration: 'asset-manifest-v1' },
    project: {
      id: project.id,
      companyId: project.companyId,
      name: project.name,
      slug: project.slug,
      description: project.description ?? '',
      location: parseJson(project.location, {}),
      branding: parseJson(project.branding, {}),
      environmentConfig: parseJson(project.environmentConfig, {}),
    },
    hierarchy: {
      buildings: buildings.map((item) => ({ ...item, metadata: parseJson(item.metadata, {}) })),
      floors: floors.map((item) => ({ ...item, metadata: parseJson(item.metadata, {}) })),
      units: units.map((item) => ({ ...item, images: parseJson(item.images, []) })),
    },
    plans: plans.map((item) => ({ ...item })),
    amenities: amenities.map((item) => ({ ...item })),
    location: location ? { ...location, coordinates: parseJson(location.coordinates, null) } : null,
    assets,
    pipeline: {
      sourceOfTruth: 'REALESTATE',
      webRenderer: 'threejs',
      cinematicRenderer: 'unreal-engine-5',
      next: assets.some((asset) => asset.unreal.sourceUrl) ? 'import-ready' : 'awaiting-assets',
    },
  };
}

export function getUnrealProjectStatus(projectId) {
  const manifest = getUnrealProjectManifest(projectId);
  if (!manifest) return null;
  const integrity = validateProjectIntegrity(projectId);
  const readyAssets = manifest.assets.filter((asset) => asset.status === 'READY').length;
  const ueAssets = manifest.assets.length;
  return {
    projectId,
    engine: manifest.engine,
    status: !integrity?.valid ? 'BLOCKED_INTEGRITY' : ueAssets === 0 ? 'AWAITING_ASSETS' : readyAssets === ueAssets ? 'READY' : 'PARTIAL',
    totalAssets: ueAssets,
    readyAssets,
    pendingAssets: ueAssets - readyAssets,
    manifestVersion: manifest.schemaVersion,
    generatedAt: manifest.generatedAt,
    integrity: integrity ? { valid: integrity.valid, errors: integrity.errors, warnings: integrity.warnings, counts: integrity.counts, checks: integrity.checks } : null,
  };
}
