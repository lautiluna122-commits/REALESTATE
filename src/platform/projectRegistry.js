import { oceanMansionsProject } from '../data/projects/oceanMansions';

export const projectCatalog = [oceanMansionsProject];

export const projectRegistry = Object.fromEntries(
  projectCatalog.map((project) => [project.id, project]),
);

export function getProjectById(projectId = 'ocean-mansions') {
  return projectRegistry[projectId] ?? projectCatalog[0];
}

export function getProjectUnits(projectId = 'ocean-mansions') {
  const project = getProjectById(projectId);
  return project.units ?? [];
}
