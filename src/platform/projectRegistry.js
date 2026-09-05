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

export function getProjectBySlug(slug = 'ocean-mansions') {
  const catalogProject = projectCatalog.find((project) => project.slug === slug || project.publication?.publicSlug === slug);
  if (catalogProject) return catalogProject;

  if (typeof window !== 'undefined') {
    try {
      const raw = window.localStorage.getItem(`realestate:project:${slug}`);
      if (raw) {
        const manifest = JSON.parse(raw);
        return {
          id: manifest.project?.id ?? slug,
          name: manifest.project?.name ?? slug,
          slug: manifest.project?.slug ?? slug,
          companyId: manifest.project?.companyId ?? '',
          location: manifest.project?.location ?? null,
          config: manifest.project?.config ?? {},
          units: manifest.inventory ?? [],
          amenities: [],
          assets: manifest.assets ?? {},
          publication: { publicSlug: slug, publicUrl: `/proyecto/${slug}` },
          status: 'DRAFT',
        };
      }
    } catch {
      // Invalid local drafts should never break the public showroom.
    }
  }

  return projectCatalog[0];
}
