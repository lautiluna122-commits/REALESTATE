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

function inventoryFromImportedPlans(plans = []) {
  const byId = new Map();

  for (const plan of plans) {
    const planFloor = plan.floor ?? (plan.floorLabel && /^\d+$/.test(String(plan.floorLabel)) ? Number(plan.floorLabel) : null);
    for (const entity of plan.entities ?? []) {
      if (entity?.type !== 'unit' || !entity.label) continue;
      const number = String(entity.label);
      const id = `draft-unit-${number}`;
      if (byId.has(id)) continue;
      byId.set(id, {
        id,
        number,
        floor: planFloor,
        surface: null,
        bedrooms: null,
        bathrooms: null,
        terrace: null,
        price: null,
        currency: 'USD',
        status: 'DRAFT',
        plan: plan.sourceName ?? null,
        modelRef: null,
        images: [],
        source: 'plan-import',
      });
    }
  }

  return [...byId.values()];
}

export function getProjectBySlug(slug = 'ocean-mansions') {
  const catalogProject = projectCatalog.find((project) => project.slug === slug || project.publication?.publicSlug === slug);
  if (catalogProject) return catalogProject;

  if (typeof window !== 'undefined') {
    try {
      const raw = window.localStorage.getItem(`realestate:project:${slug}`);
      if (raw) {
        const manifest = JSON.parse(raw);
        const importedInventory = Array.isArray(manifest.inventory) ? manifest.inventory : [];
        const mappedInventory = importedInventory.length ? importedInventory : inventoryFromImportedPlans(manifest.plans);

        return {
          id: manifest.project?.id ?? slug,
          name: manifest.project?.name ?? slug,
          slug: manifest.project?.slug ?? slug,
          companyId: manifest.project?.companyId ?? '',
          location: manifest.project?.location ?? null,
          config: manifest.project?.config ?? {},
          units: mappedInventory,
          amenities: [],
          assets: manifest.assets ?? {},
          plans: manifest.plans ?? [],
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
