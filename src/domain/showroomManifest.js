import { createProjectAssetManifest, groupAssetsByKind } from './projectAssetModels';

export const SHOWROOM_MANIFEST_VERSION = '1.1';

function deriveInventoryFromPlans(importedPlans = [], projectId = '') {
  const seen = new Set();
  const derived = [];

  for (const plan of importedPlans) {
    for (const entity of plan.entities ?? []) {
      if (entity?.type !== 'unit' || !entity.label) continue;
      const number = String(entity.label);
      if (seen.has(number)) continue;
      seen.add(number);
      const numeric = Number(number);
      const floor = plan.floor ?? (Number.isFinite(numeric) && numeric >= 100 ? Math.floor(numeric / 100) : null);
      derived.push({
        id: `unit-${number}`,
        number,
        floor,
        surface: null,
        bedrooms: null,
        bathrooms: null,
        terrace: null,
        price: null,
        currency: 'USD',
        status: 'AVAILABLE',
        plan: plan.sourceName ?? '',
        modelRef: '',
        images: [],
        projectId,
        provenance: { source: 'plan-import', confidence: entity.confidence ?? null },
      });
    }
  }

  return derived;
}

export function createShowroomManifest({ project, importedPlans = [], assets = [] } = {}) {
  const projectId = project?.id ?? '';
  const allAssets = [...assets];
  const grouped = groupAssetsByKind(allAssets);
  const explicitInventory = Array.isArray(project?.units) ? project.units : [];
  const inventorySource = explicitInventory.length ? explicitInventory : deriveInventoryFromPlans(importedPlans, projectId);

  return {
    version: SHOWROOM_MANIFEST_VERSION,
    project: {
      id: projectId,
      name: project?.name ?? 'Nuevo proyecto',
      slug: project?.slug ?? '',
      companyId: project?.companyId ?? '',
      location: project?.location ?? null,
      config: project?.config ?? null,
    },
    inventory: inventorySource.map((unit) => ({
      id: unit.id,
      number: unit.number,
      floor: unit.floor,
      surface: unit.surface,
      bedrooms: unit.bedrooms,
      bathrooms: unit.bathrooms,
      terrace: unit.terrace,
      price: unit.price,
      currency: unit.currency,
      status: unit.status,
      plan: unit.plan,
      modelRef: unit.modelRef,
      images: unit.images ?? [],
      provenance: unit.provenance ?? null,
    })),
    plans: importedPlans.map((plan) => ({
      sourceName: plan.sourceName,
      sourceType: plan.sourceType,
      page: plan.page,
      floor: plan.floor,
      floorLabel: plan.floorLabel,
      entities: plan.entities,
      unitFootprints: plan.unitFootprints,
      provenance: plan.provenance,
    })),
    assets: createProjectAssetManifest({
      projectId,
      assets: allAssets,
      primary: {
        buildingModel: grouped.buildingModel?.find((asset) => asset.isPrimary) ?? grouped.buildingModel?.[0] ?? null,
        thumbnail: grouped.thumbnail?.[0] ?? null,
        environment: grouped.environment?.[0] ?? null,
      },
    }),
    generation: {
      stages: ['IMPORT', 'INTERPRET', 'REVIEW', 'MAP', 'GENERATE', 'PUBLISH'],
      rendererFallback: 'model → media → procedural',
      planToScene: 'plan entities → floor/unit mapping → showroom geometry',
      inventorySource: explicitInventory.length ? 'project-data' : 'plan-import-derived',
    },
  };
}

export function validateShowroomManifest(manifest) {
  const errors = [];
  if (!manifest?.project?.id) errors.push('project.id is required');
  if (!manifest?.project?.slug) errors.push('project.slug is required');
  if (!Array.isArray(manifest?.inventory)) errors.push('inventory must be an array');
  if (!Array.isArray(manifest?.plans)) errors.push('plans must be an array');
  if (!manifest?.assets?.fallbacks) errors.push('asset fallback policy is missing');
  return { valid: errors.length === 0, errors };
}
