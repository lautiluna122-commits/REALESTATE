import { getProjectById } from '../platform/projectRegistry.js';

export function createProjectExperience(projectId = 'ocean-mansions') {
  const project = getProjectById(projectId);
  if (!project) return null;

  return {
    projectId: project.id,
    projectName: project.name,
    data: project,
    assets: project.assets,
    config: project.config,
    publication: project.publication,
    scene: {
      environment: project.config.environment,
      experience: project.config.experience,
      lighting: {
        dayNight: project.config.experience.dayNight,
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
