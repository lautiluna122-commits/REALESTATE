import { getProjectById } from '../platform/projectRegistry.js';

export function createProjectExperience(projectId) {
  if (!projectId) return null;

  const project = getProjectById(projectId);
  if (!project) return null;

  const config = project.config && typeof project.config === 'object' ? project.config : {};
  const environment = config.environment && typeof config.environment === 'object' ? config.environment : {};
  const experience = config.experience && typeof config.experience === 'object' ? config.experience : {};

  return {
    projectId: project.id,
    projectName: project.name,
    data: project,
    assets: Array.isArray(project.assets) ? project.assets : [],
    config,
    publication: project.publication ?? null,
    scene: {
      environment,
      experience,
      lighting: {
        dayNight: Boolean(experience.dayNight),
        autoExposure: true,
      },
    },
    engine: {
      type: 'three-js',
      renderer: 'react-three-fiber',
      supports: ['walking', 'floorSelection', 'apartmentTour', 'dayNight'],
    },
  };
}

export function loadProjectExperience(projectId) {
  return createProjectExperience(projectId);
}
