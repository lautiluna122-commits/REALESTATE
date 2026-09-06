export const SHOWROOM_RENDERERS = {
  STANDARD: 'three',
  PREMIUM: 'unreal',
};

export const SHOWROOM_MODES = {
  STANDARD: 'standard',
  PREMIUM: 'premium',
  ULTRA: 'ultra',
};

export function getShowroomEngine(project) {
  const configured = project?.config?.experience?.renderer;
  const mode = project?.config?.experience?.quality ?? SHOWROOM_MODES.STANDARD;
  const renderer = configured ?? (mode === SHOWROOM_MODES.STANDARD ? SHOWROOM_RENDERERS.STANDARD : SHOWROOM_RENDERERS.PREMIUM);

  return {
    mode,
    renderer,
    capabilities: {
      exterior: true,
      floorSelection: true,
      unitSelection: true,
      interior: true,
      roomNavigation: true,
      plans: true,
      panorama360: true,
      materials: true,
      dayNight: true,
      analytics: true,
      liveInventory: true,
    },
  };
}

export function createShowroomManifest(project) {
  return {
    version: '1.0',
    projectId: project?.id ?? null,
    slug: project?.slug ?? null,
    renderer: getShowroomEngine(project).renderer,
    mode: getShowroomEngine(project).mode,
    scene: {
      building: project?.assets?.buildingModel ?? null,
      floors: project?.assets?.floors ?? [],
      units: project?.units ?? [],
      interiors: project?.assets?.interiors ?? [],
      panoramas: project?.assets?.panoramas ?? [],
      plans: project?.plans ?? [],
    },
    experience: project?.config?.experience ?? {},
    branding: project?.config?.branding ?? {},
  };
}
