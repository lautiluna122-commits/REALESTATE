export const SHOWROOM_RENDERERS = Object.freeze({
  STANDARD: 'three',
  PREMIUM: 'three-premium',
  ULTRA: 'unreal',
});

export const SHOWROOM_STATES = Object.freeze({
  EXTERIOR: 'exterior',
  BUILDING: 'building',
  FLOOR: 'floor',
  UNIT: 'unit',
  INTERIOR: 'interior',
});

export const SHOWROOM_MODES = Object.freeze({
  STANDARD: 'standard',
  PREMIUM: 'premium',
  ULTRA: 'ultra',
});

export function getShowroomEngine(project = {}) {
  const experience = project.config?.experience ?? {};
  const mode = experience.quality ?? SHOWROOM_MODES.STANDARD;
  const requested = experience.renderer;
  const renderer = requested ?? (mode === SHOWROOM_MODES.STANDARD ? SHOWROOM_RENDERERS.STANDARD : SHOWROOM_RENDERERS.PREMIUM);

  return {
    mode,
    renderer: Object.values(SHOWROOM_RENDERERS).includes(renderer) ? renderer : SHOWROOM_RENDERERS.STANDARD,
    capabilities: {
      exterior: true,
      floorSelection: experience.floorSelection !== false,
      unitSelection: true,
      interior: experience.apartmentTour !== false,
      roomNavigation: experience.apartmentTour !== false,
      plans: true,
      panorama360: true,
      materials: true,
      dayNight: experience.dayNight !== false,
      analytics: true,
      liveInventory: true,
    },
  };
}

export function resolveShowroomAsset(project = {}, kind) {
  const direct = project.assets?.[kind];
  if (direct?.path) return direct;
  const manifest = project.assets?.manifest;
  const exact = manifest?.assets?.find((asset) => asset.kind === kind && asset.path);
  if (exact) return exact;
  const fallbackKinds = manifest?.fallbacks?.[kind] ?? [];
  return fallbackKinds.map((fallbackKind) => manifest?.assets?.find((asset) => asset.kind === fallbackKind && asset.path)).find(Boolean) ?? null;
}

export function createShowroomManifest(project = {}) {
  const engine = getShowroomEngine(project);
  return {
    version: '2.0',
    projectId: project.id ?? null,
    slug: project.slug ?? null,
    renderer: engine.renderer,
    mode: engine.mode,
    scene: {
      building: resolveShowroomAsset(project, 'buildingModel'),
      exterior: resolveShowroomAsset(project, 'exteriorRender'),
      units: project.units ?? [],
      unitModel: resolveShowroomAsset(project, 'unitModel'),
      interiors: project.assets?.interiors ?? [],
      interiorRender: resolveShowroomAsset(project, 'interiorRender'),
      panoramas: project.assets?.panoramas ?? [],
      panorama360: resolveShowroomAsset(project, 'panorama360'),
      plans: project.plans ?? [],
    },
    experience: engine.capabilities,
    branding: project.config?.branding ?? {},
    content: project.config?.content ?? {},
  };
}
