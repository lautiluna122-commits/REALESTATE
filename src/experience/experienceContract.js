/**
 * Renderer-neutral contract for the public project experience.
 *
 * This file intentionally contains no Three.js/React code. It defines the
 * boundary between project data and whichever renderer is used later.
 */

export const EXPERIENCE_CONTRACT_VERSION = '1.0';

export function createExperienceContract(project) {
  if (!project?.id) {
    throw new Error('A project with an id is required to build an experience contract.');
  }

  return {
    version: EXPERIENCE_CONTRACT_VERSION,
    project: {
      id: project.id,
      name: project.name ?? '',
      description: project.description ?? '',
      publicSlug: project.publicSlug ?? null,
    },
    building: {
      id: project.building?.id ?? null,
      name: project.building?.name ?? '',
      floors: project.floors ?? [],
    },
    units: project.units ?? [],
    plans: project.plans ?? [],
    assets: project.assets ?? [],
    amenities: project.amenities ?? [],
    location: project.location ?? null,
    publication: project.publication ?? null,
    scene: {
      environment: project.config?.environment ?? null,
      dayNight: project.config?.experience?.dayNight ?? true,
      interior: project.config?.experience?.apartmentTour ?? true,
      floorSelection: project.config?.experience?.floorSelection ?? true,
      walking: project.config?.experience?.walking ?? true,
    },
  };
}
