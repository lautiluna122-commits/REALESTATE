export const ASSET_KIND = {
  BUILDING_MODEL: 'buildingModel',
  FLOOR_MODEL: 'floorModel',
  UNIT_MODEL: 'unitModel',
  PLAN: 'plan',
  EXTERIOR_RENDER: 'exteriorRender',
  INTERIOR_RENDER: 'interiorRender',
  PANORAMA: 'panorama360',
  VIDEO: 'video',
  THUMBNAIL: 'thumbnail',
  ENVIRONMENT: 'environment',
  MAP: 'map',
  BRANDING: 'branding',
};

export const ASSET_SOURCE = {
  UPLOAD: 'upload',
  GENERATED: 'generated',
  EXTERNAL: 'external',
};

export const ASSET_STATUS = {
  PENDING: 'PENDING',
  READY: 'READY',
  FAILED: 'FAILED',
};

export const ACCEPTED_ASSET_EXTENSIONS = {
  model: ['glb', 'gltf', 'fbx', 'obj'],
  plan: ['pdf', 'png', 'jpg', 'jpeg', 'svg', 'dwg', 'dxf'],
  image: ['png', 'jpg', 'jpeg', 'webp', 'avif'],
  panorama: ['jpg', 'jpeg', 'png', 'webp'],
  video: ['mp4', 'webm', 'mov'],
};

export function createProjectAsset(input = {}) {
  return {
    id: input.id ?? `asset-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    projectId: input.projectId ?? '',
    kind: input.kind ?? ASSET_KIND.THUMBNAIL,
    name: input.name ?? 'asset',
    path: input.path ?? '',
    source: input.source ?? ASSET_SOURCE.UPLOAD,
    status: input.status ?? ASSET_STATUS.PENDING,
    mimeType: input.mimeType ?? '',
    size: input.size ?? 0,
    width: input.width ?? null,
    height: input.height ?? null,
    floor: input.floor ?? null,
    unitId: input.unitId ?? null,
    tags: Array.isArray(input.tags) ? input.tags : [],
    metadata: input.metadata ?? {},
    createdAt: input.createdAt ?? new Date().toISOString(),
  };
}

export function createProjectAssetManifest(input = {}) {
  const assets = Array.isArray(input.assets) ? input.assets : [];
  return {
    version: '1.0',
    projectId: input.projectId ?? '',
    assets,
    primary: input.primary ?? {},
    fallbacks: {
      building: ['buildingModel', 'exteriorRender', 'generated'],
      unit: ['unitModel', 'interiorRender', 'plan'],
      plan: ['plan'],
      panorama: ['panorama360', 'exteriorRender'],
      environment: ['environment', 'exteriorRender', 'generated'],
    },
  };
}

export function groupAssetsByKind(assets = []) {
  return assets.reduce((groups, asset) => {
    const key = asset.kind ?? 'other';
    groups[key] ??= [];
    groups[key].push(asset);
    return groups;
  }, {});
}

export function selectBestAsset(assets = [], kinds = []) {
  for (const kind of kinds) {
    const match = assets.find((asset) => asset.kind === kind && asset.status !== ASSET_STATUS.FAILED && asset.path);
    if (match) return match;
  }
  return null;
}
