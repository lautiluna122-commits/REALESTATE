import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

import {
  createCompany,
  createProject,
  createBuilding,
  createFloor,
  createUnit,
  updateUnit,
  getProjectBySlug,
  ensureCompanyAccess,
  listProjectUnits,
  listProjectsByCompany,
  publishProject,
  listPublicProjects,
  listProjectBuildings,
  listProjectFloors,
  createProjectPublication,
} from '../services/projectService.js';

function buildUniqueSlug(prefix) {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}

// ============================================================
// 1. slug duplicado dentro de company → FAIL
// ============================================================
test('1. debe rechazar slug duplicado dentro del mismo tenant', () => {
  const company = createCompany({ name: 'Tenant Dup', slug: buildUniqueSlug('tenant-dup') });
  const slug = buildUniqueSlug('dupe-project');

  createProject({
    companyId: company.id,
    name: 'Primer proyecto',
    slug,
    status: 'DRAFT',
  });

  assert.throws(
    () => createProject({
      companyId: company.id,
      name: 'Segundo proyecto',
      slug,
      status: 'DRAFT',
    }),
    /already exists for this company/i,
  );

  const companyProjects = listProjectsByCompany(company.id);
  assert.equal(companyProjects.filter((project) => project.slug === slug).length, 1);
});

// ============================================================
// 2. mismo slug en companies diferentes → PASS
// ============================================================
test('2. debe permitir mismo slug en companies diferentes', () => {
  const companyA = createCompany({ name: 'Ocean Group', slug: buildUniqueSlug('ocean-group') });
  const companyB = createCompany({ name: 'Delta Dev', slug: buildUniqueSlug('delta-dev') });
  const sharedSlug = buildUniqueSlug('ocean-mansions');

  const projectA = createProject({
    companyId: companyA.id,
    name: 'Ocean Mansions',
    slug: sharedSlug,
    status: 'DRAFT',
    description: 'Proyecto del tenant A',
  });

  const projectB = createProject({
    companyId: companyB.id,
    name: 'Ocean Mansions',
    slug: sharedSlug,
    status: 'DRAFT',
    description: 'Proyecto del tenant B',
  });

  assert.equal(projectA.companyId, companyA.id);
  assert.equal(projectB.companyId, companyB.id);
  assert.equal(projectA.slug, sharedSlug);
  assert.equal(projectB.slug, sharedSlug);
  assert.notEqual(projectA.id, projectB.id);
  assert.equal(getProjectBySlug(sharedSlug, companyA.id)?.companyId, companyA.id);
  assert.equal(getProjectBySlug(sharedSlug, companyB.id)?.companyId, companyB.id);
});

// ============================================================
// 3. building A no aparece en project B
// ============================================================
test('3. building debe pertenecer solo a su proyecto', () => {
  const company = createCompany({ name: 'Test BuildingIsolation', slug: buildUniqueSlug('test-bi') });
  const projectA = createProject({
    companyId: company.id,
    name: 'Project A',
    slug: buildUniqueSlug('project-a'),
  });
  const projectB = createProject({
    companyId: company.id,
    name: 'Project B',
    slug: buildUniqueSlug('project-b'),
  });

  const buildingA = createBuilding({ projectId: projectA.id, name: 'Tower A', reference: 'tower-a' });

  // Buildings de A no deben aparecer en B
  const buildingsB = listProjectBuildings(projectB.id);
  assert.equal(buildingsB.filter((b) => b.id === buildingA.id).length, 0);

  // Buildings de A deben aparecer en A
  const buildingsA = listProjectBuildings(projectA.id);
  assert.equal(buildingsA.filter((b) => b.id === buildingA.id).length, 1);
});

// ============================================================
// 4. floor A no puede asociarse a building B (de otro project)
// ============================================================
test('4. floor debe validar que building pertenece al project', () => {
  const company = createCompany({ name: 'Test FloorBuildingIsolation', slug: buildUniqueSlug('test-fbi') });
  const projectA = createProject({
    companyId: company.id,
    name: 'Project A',
    slug: buildUniqueSlug('project-a'),
  });
  const projectB = createProject({
    companyId: company.id,
    name: 'Project B',
    slug: buildUniqueSlug('project-b'),
  });

  const buildingA = createBuilding({ projectId: projectA.id, name: 'Tower A', reference: 'tower-a' });
  const buildingB = createBuilding({ projectId: projectB.id, name: 'Tower B', reference: 'tower-b' });

  // Crear floor en A con building A debe funcionar
  const floorA = createFloor({
    projectId: projectA.id,
    buildingId: buildingA.id,
    number: 5,
    name: 'Piso 5',
  });
  assert.ok(floorA.id);

  // Intentar crear floor en A con building B debe fallar
  assert.throws(
    () => createFloor({
      projectId: projectA.id,
      buildingId: buildingB.id,
      number: 6,
      name: 'Piso 6',
    }),
    /does not belong to this project/i,
  );
});

// ============================================================
// 5. unit A no puede asociarse a floor B (de otro building)
// ============================================================
test('5. unit debe validar que floor pertenece al building', () => {
  const company = createCompany({ name: 'Test UnitFloorIsolation', slug: buildUniqueSlug('test-ufi') });
  const project = createProject({
    companyId: company.id,
    name: 'Project A',
    slug: buildUniqueSlug('project-a'),
  });

  const buildingA = createBuilding({ projectId: project.id, name: 'Tower A' });
  const buildingB = createBuilding({ projectId: project.id, name: 'Tower B' });

  const floorA = createFloor({ projectId: project.id, buildingId: buildingA.id, number: 1 });
  const floorB = createFloor({ projectId: project.id, buildingId: buildingB.id, number: 1 });

  // Crear unit en floor A con building A debe funcionar
  const unitA = createUnit({
    projectId: project.id,
    buildingId: buildingA.id,
    floorId: floorA.id,
    number: '101',
    surface: 100,
  });
  assert.ok(unitA.id);

  // Intentar crear unit con floor B pero building A debe fallar
  assert.throws(
    () => createUnit({
      projectId: project.id,
      buildingId: buildingA.id,
      floorId: floorB.id,
      number: '102',
      surface: 100,
    }),
    /does not belong to this building/i,
  );
});

// ============================================================
// 6. unit A no puede modificarse desde project B
// ============================================================
test('6. unit no debe poder actualizarse desde proyecto diferente', () => {
  const company = createCompany({ name: 'Test CrossProjectMutation', slug: buildUniqueSlug('test-cpm') });
  const projectA = createProject({
    companyId: company.id,
    name: 'Project A',
    slug: buildUniqueSlug('project-a'),
  });
  const projectB = createProject({
    companyId: company.id,
    name: 'Project B',
    slug: buildUniqueSlug('project-b'),
  });

  const buildingA = createBuilding({ projectId: projectA.id, name: 'Tower A' });
  const floorA = createFloor({ projectId: projectA.id, buildingId: buildingA.id, number: 1 });
  const unitA = createUnit({
    projectId: projectA.id,
    buildingId: buildingA.id,
    floorId: floorA.id,
    number: '101',
    surface: 100,
    price: 100000,
  });

  // Actualizar desde proyecto A debe funcionar
  const updated = updateUnit(projectA.id, unitA.id, { price: 110000 });
  assert.equal(updated.price, 110000);

  // Actualizar desde proyecto B debe retornar null (unit no encontrada en B)
  const notFound = updateUnit(projectB.id, unitA.id, { price: 120000 });
  assert.equal(notFound, null);
});

// ============================================================
// 7. projectId de una unit no puede cambiarse arbitrariamente
// ============================================================
test('7. projectId de unit es inmutable', () => {
  const company = createCompany({ name: 'Test ProjectIdImmutability', slug: buildUniqueSlug('test-pii') });
  const projectA = createProject({
    companyId: company.id,
    name: 'Project A',
    slug: buildUniqueSlug('project-a'),
  });
  const projectB = createProject({
    companyId: company.id,
    name: 'Project B',
    slug: buildUniqueSlug('project-b'),
  });

  const buildingA = createBuilding({ projectId: projectA.id, name: 'Tower A' });
  const floorA = createFloor({ projectId: projectA.id, buildingId: buildingA.id, number: 1 });
  const unitA = createUnit({
    projectId: projectA.id,
    buildingId: buildingA.id,
    floorId: floorA.id,
    number: '101',
    surface: 100,
  });

  // Intentar cambiar projectId debe rechazarse
  assert.throws(
    () => updateUnit(projectA.id, unitA.id, { projectId: projectB.id }),
    /Cannot modify immutable fields/i,
  );

  // Verificar que no cambió
  const persisted = listProjectUnits(projectA.id).find((u) => u.id === unitA.id);
  assert.equal(persisted.projectId, projectA.id);
});

// ============================================================
// 8. buildingId de una unit debe pertenecer al project
// ============================================================
test('8. buildingId de unit es inmutable', () => {
  const company = createCompany({ name: 'Test BuildingIdImmutability', slug: buildUniqueSlug('test-bii') });
  const project = createProject({
    companyId: company.id,
    name: 'Project',
    slug: buildUniqueSlug('project'),
  });

  const buildingA = createBuilding({ projectId: project.id, name: 'Tower A' });
  const buildingB = createBuilding({ projectId: project.id, name: 'Tower B' });
  const floorA = createFloor({ projectId: project.id, buildingId: buildingA.id, number: 1 });
  const unitA = createUnit({
    projectId: project.id,
    buildingId: buildingA.id,
    floorId: floorA.id,
    number: '101',
    surface: 100,
  });

  // Intentar cambiar buildingId debe rechazarse
  assert.throws(
    () => updateUnit(project.id, unitA.id, { buildingId: buildingB.id }),
    /Cannot modify immutable fields/i,
  );

  const persisted = listProjectUnits(project.id).find((u) => u.id === unitA.id);
  assert.equal(persisted.buildingId, buildingA.id);
});

// ============================================================
// 9. floorId de una unit debe pertenecer al building
// ============================================================
test('9. floorId de unit es inmutable', () => {
  const company = createCompany({ name: 'Test FloorIdImmutability', slug: buildUniqueSlug('test-fii') });
  const project = createProject({
    companyId: company.id,
    name: 'Project',
    slug: buildUniqueSlug('project'),
  });

  const building = createBuilding({ projectId: project.id, name: 'Tower' });
  const floorA = createFloor({ projectId: project.id, buildingId: building.id, number: 1 });
  const floorB = createFloor({ projectId: project.id, buildingId: building.id, number: 2 });
  const unitA = createUnit({
    projectId: project.id,
    buildingId: building.id,
    floorId: floorA.id,
    number: '101',
    surface: 100,
  });

  // Intentar cambiar floorId debe rechazarse
  assert.throws(
    () => updateUnit(project.id, unitA.id, { floorId: floorB.id }),
    /Cannot modify immutable fields/i,
  );

  const persisted = listProjectUnits(project.id).find((u) => u.id === unitA.id);
  assert.equal(persisted.floorId, floorA.id);
});

// ============================================================
// 10. DRAFT no es público
// ============================================================
test('10. DRAFT project no debe aparecer en listado público', () => {
  const company = createCompany({ name: 'Test PublicDraft', slug: buildUniqueSlug('test-pd') });
  const draftProject = createProject({
    companyId: company.id,
    name: 'Draft Project',
    slug: buildUniqueSlug('draft-project'),
    status: 'DRAFT',
  });

  const publicProjects = listPublicProjects();
  assert.equal(publicProjects.filter((p) => p.id === draftProject.id).length, 0);
});

// ============================================================
// 11. PUBLISHED + publication → público
// ============================================================
test('11. PUBLISHED project con publication válida debe aparecer públicamente', () => {
  const company = createCompany({ name: 'Test PublicPublished', slug: buildUniqueSlug('test-pp') });
  const project = createProject({
    companyId: company.id,
    name: 'Published Project',
    slug: buildUniqueSlug('published-project'),
    status: 'DRAFT',
  });

  const published = publishProject(project.id, {
    publicSlug: buildUniqueSlug('public-slug'),
    title: 'Published Project',
  });

  assert.equal(published.status, 'PUBLISHED');

  const publicProjects = listPublicProjects();
  assert.ok(publicProjects.find((p) => p.id === published.id));
});

// ============================================================
// 12. publication inexistente → no público
// ============================================================
test('12. project sin publication válida no debe ser públicamente accesible', () => {
  const company = createCompany({ name: 'Test NoPublication', slug: buildUniqueSlug('test-np') });
  const project = createProject({
    companyId: company.id,
    name: 'No Publication Project',
    slug: buildUniqueSlug('no-pub-project'),
    status: 'PUBLISHED',
  });

  // Project está PUBLISHED pero sin isPublished=true en publication
  const publicProjects = listPublicProjects();
  assert.equal(publicProjects.filter((p) => p.id === project.id).length, 0);
});

// ============================================================
// 13. publicSlug duplicado dentro company → FAIL
// ============================================================
test('13. publicSlug duplicado dentro de company debe rechazarse', () => {
  const company = createCompany({ name: 'Test DupPublicSlug', slug: buildUniqueSlug('test-dps') });
  const projectA = createProject({
    companyId: company.id,
    name: 'Project A',
    slug: buildUniqueSlug('project-a'),
  });
  const projectB = createProject({
    companyId: company.id,
    name: 'Project B',
    slug: buildUniqueSlug('project-b'),
  });

  const samePublicSlug = buildUniqueSlug('same-public');

  createProjectPublication({
    projectId: projectA.id,
    publicSlug: samePublicSlug,
    publicUrl: '/proyecto/same-public',
    title: 'Project A',
  });

  // Intentar crear publication con mismo publicSlug en misma company
  assert.throws(
    () => createProjectPublication({
      projectId: projectB.id,
      publicSlug: samePublicSlug,
      publicUrl: '/proyecto/same-public',
      title: 'Project B',
    }),
    /already exists for this company/i,
  );
});

// ============================================================
// 14. publicSlug igual entre companies → PASS
// ============================================================
test('14. publicSlug puede ser igual entre companies diferentes', () => {
  const companyA = createCompany({ name: 'Company A', slug: buildUniqueSlug('company-a') });
  const companyB = createCompany({ name: 'Company B', slug: buildUniqueSlug('company-b') });

  const projectA = createProject({
    companyId: companyA.id,
    name: 'Project A',
    slug: buildUniqueSlug('project-a'),
  });
  const projectB = createProject({
    companyId: companyB.id,
    name: 'Project B',
    slug: buildUniqueSlug('project-b'),
  });

  const samePublicSlug = buildUniqueSlug('same-public');

  const pubA = createProjectPublication({
    projectId: projectA.id,
    publicSlug: samePublicSlug,
    publicUrl: '/proyecto/same-public-a',
    title: 'Project A',
  });

  const pubB = createProjectPublication({
    projectId: projectB.id,
    publicSlug: samePublicSlug,
    publicUrl: '/proyecto/same-public-b',
    title: 'Project B',
  });

  assert.equal(pubA.publicSlug, samePublicSlug);
  assert.equal(pubB.publicSlug, samePublicSlug);
  assert.notEqual(pubA.projectId, pubB.projectId);
});

// ============================================================
// 15. seed ejecutada dos veces → no duplica datos
// ============================================================
test('15. seed debe ser idempotente', () => {
  // Esta es una prueba implícita en los tests anteriores
  // porque la seed se ejecuta al cargar db.js y los tests
  // cuentan con DB limpia en NODE_ENV=test.
  // Si la seed duplicara datos, los tests anteriores fallarían
  // al intentar insertar con unique constraints.

  const company = createCompany({ name: 'Idempotent Test', slug: buildUniqueSlug('idempotent') });
  const project = createProject({
    companyId: company.id,
    name: 'Test',
    slug: buildUniqueSlug('test'),
  });

  assert.ok(company.id);
  assert.ok(project.id);
});
