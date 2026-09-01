import { getProjectById } from '../platform/projectRegistry';
import { createExperienceContract } from './experienceContract';

export function createProjectExperience(projectId = 'ocean-mansions') {
  const project = getProjectById(projectId);
  const experience = createExperienceContract(project);

  return {
    ...experience,
    data: project,
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
