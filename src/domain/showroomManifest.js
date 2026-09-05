import { createProjectAssetManifest, groupAssetsByKind } from './projectAssetModels';

export const SHOWROOM_MANIFEST_VERSION = '1.0';

export function createShowroomManifest({ project, importedPlans = [], assets = [] } = {}) {
  const projectId = project?.id ?? '';
  const allAssets = [...assets];
  const grouped = groupAssetsByKind(allAssets);

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
    inventory: (project?.units ?? []).map((unit) => ({
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
