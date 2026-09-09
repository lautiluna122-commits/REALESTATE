import { getDb } from '../db.js';

function parseJson(value, fallback = {}) {
  if (!value) return fallback;
  try { return JSON.parse(value); } catch { return fallback; }
}

export function validateProjectIntegrity(projectId) {
  const db = getDb();
  const project = db.prepare('SELECT * FROM projects WHERE id = ? LIMIT 1').get(projectId);
  if (!project) return null;

  const buildings = db.prepare('SELECT * FROM buildings WHERE projectId = ? ORDER BY createdAt ASC').all(projectId);
  const floors = db.prepare('SELECT * FROM floors WHERE projectId = ? ORDER BY number ASC, createdAt ASC').all(projectId);
  const units = db.prepare('SELECT * FROM units WHERE projectId = ? ORDER BY floorId ASC, number ASC').all(projectId);
  const plans = db.prepare('SELECT * FROM plans WHERE projectId = ? ORDER BY createdAt ASC').all(projectId);
  const assets = db.prepare('SELECT * FROM assets WHERE projectId = ? ORDER BY createdAt ASC').all(projectId);
  const amenities = db.prepare('SELECT * FROM amenities WHERE projectId = ? ORDER BY createdAt ASC').all(projectId);
  const location = db.prepare('SELECT * FROM locations WHERE projectId = ? ORDER BY createdAt ASC LIMIT 1').get(projectId) ?? null;
  const publication = db.prepare('SELECT * FROM project_publications WHERE projectId = ? LIMIT 1').get(projectId) ?? null;

  const errors = [];
  const warnings = [];
  const buildingIds = new Set(buildings.map((item) => item.id));
  const floorIds = new Set(floors.map((item) => item.id));
  const planIds = new Set(plans.map((item) => item.id));
  const assetIds = new Set(assets.map((item) => item.id));

  if (!project.name?.trim()) errors.push('Project name is missing');
  if (!project.slug?.trim()) errors.push('Project slug is missing');
  if (!project.companyId) errors.push('Project companyId is missing');
  if (!buildings.length) warnings.push('Project has no building');
  if (!location) warnings.push('Project has no location record');
  if (!publication) warnings.push('Project has no publication record');

  for (const floor of floors) {
    if (!buildingIds.has(floor.buildingId)) errors.push(`Floor ${floor.id} references missing building ${floor.buildingId}`);
    if (floor.projectId !== projectId) errors.push(`Floor ${floor.id} belongs to another project`);
  }

  for (const unit of units) {
    if (!buildingIds.has(unit.buildingId)) errors.push(`Unit ${unit.number} references missing building ${unit.buildingId}`);
    if (!floorIds.has(unit.floorId)) errors.push(`Unit ${unit.number} references missing floor ${unit.floorId}`);
    if (unit.planId && !planIds.has(unit.planId)) errors.push(`Unit ${unit.number} references missing plan ${unit.planId}`);
    if (!unit.number?.toString().trim()) errors.push(`Unit ${unit.id} is missing a number`);
  }

  const duplicateUnits = db.prepare(`SELECT floorId, number, COUNT(*) AS count FROM units WHERE projectId = ? GROUP BY floorId, number HAVING COUNT(*) > 1`).all(projectId);
  for (const duplicate of duplicateUnits) errors.push(`Duplicate unit ${duplicate.number} on floor ${duplicate.floorId}`);

  for (const asset of assets) {
    const metadata = parseJson(asset.metadata, {});
    if (asset.entityId && ['BUILDING', 'FLOOR', 'UNIT', 'PLAN', 'AMENITY', 'EXPERIENCE'].includes(asset.entityType)) {
      const exists = asset.entityType === 'BUILDING' ? buildingIds.has(asset.entityId)
        : asset.entityType === 'FLOOR' ? floorIds.has(asset.entityId)
          : asset.entityType === 'PLAN' ? planIds.has(asset.entityId)
            : asset.entityType === 'UNIT' ? units.some((item) => item.id === asset.entityId)
              : asset.entityType === 'AMENITY' ? amenities.some((item) => item.id === asset.entityId)
                : true;
      if (!exists) errors.push(`Asset ${asset.name} references missing ${asset.entityType} ${asset.entityId}`);
    }
    if (asset.path && asset.path.includes('..')) errors.push(`Asset ${asset.name} contains an unsafe path`);
    if (!asset.path && !asset.url) warnings.push(`Asset ${asset.name} is not uploaded yet`);
    if (metadata.unrealImportPath && metadata.unrealImportPath.includes('..')) errors.push(`Asset ${asset.name} has an unsafe Unreal import path`);
  }

  if (publication?.isPublished && project.status !== 'PUBLISHED') {
    errors.push('Publication is marked published while project lifecycle is not PUBLISHED');
  }
  if (project.status === 'PUBLISHED' && !publication?.isPublished) {
    errors.push('Project lifecycle is PUBLISHED but publication record is not published');
  }

  const parsedLocation = project.location ? parseJson(project.location, null) : null;
  if (!parsedLocation) warnings.push('Project location JSON is missing or invalid');

  return {
    valid: errors.length === 0,
    project: { id: project.id, name: project.name, slug: project.slug, status: project.status, companyId: project.companyId },
    counts: { buildings: buildings.length, floors: floors.length, units: units.length, plans: plans.length, assets: assets.length, amenities: amenities.length, locations: location ? 1 : 0, publications: publication ? 1 : 0 },
    errors,
    warnings,
    checks: {
      hierarchy: !errors.some((item) => /Floor|Unit/.test(item)),
      inventory: !errors.some((item) => /Duplicate unit|Unit/.test(item)),
      assets: !errors.some((item) => /Asset/.test(item)),
      publication: !errors.some((item) => /Publication|Project lifecycle/.test(item)),
      unreal: assets.filter((item) => ['buildingModel','floorModel','unitModel','exteriorRender','interiorRender','panorama360','video','environment'].includes(item.kind)).every((item) => !item.path || !item.path.includes('..')),
    },
  };
}
