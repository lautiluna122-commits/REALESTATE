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
} from '../services/projectService.js';

function buildUniqueSlug(prefix) {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}

test('1. debe crear una empresa y un proyecto dentro de su tenant sin conflicto por slug global', () => {
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

test('2. debe rechazar un slug duplicado dentro del mismo tenant', () => {
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

test('3. debe persistir la unidad, actualizar precio y estado dentro del proyecto', () => {
  const company = createCompany({ name: 'Persistencia', slug: buildUniqueSlug('persistencia-company') });
  const project = createProject({
    companyId: company.id,
    name: 'Residencial A',
    slug: buildUniqueSlug('residencial-a'),
    status: 'DRAFT',
  });

  const building = createBuilding({ projectId: project.id, name: 'Tower A', reference: 'tower-a' });
  const floor = createFloor({ projectId: project.id, buildingId: building.id, number: 8, name: 'Piso 8' });

  const unit = createUnit({
    projectId: project.id,
    buildingId: building.id,
    floorId: floor.id,
    number: '804',
    surface: 128,
    bedrooms: 3,
    bathrooms: 2,
    terrace: 24,
    price: 485000,
    currency: 'USD',
    status: 'AVAILABLE',
    description: 'Unidad de prueba',
    modelReference: 'building-model',
    images: ['unit-804-1.jpg'],
  });

  const updated = updateUnit(unit.id, { price: 490000, status: 'SOLD' });
  assert.equal(updated.price, 490000);
  assert.equal(updated.status, 'SOLD');

  const persistedUnit = listProjectUnits(project.id).find((entry) => entry.id === unit.id);
  assert.ok(persistedUnit);
  assert.equal(persistedUnit.price, 490000);
  assert.equal(persistedUnit.status, 'SOLD');
});

test('4. debe publicar un proyecto y mostrarlo solo cuando está publicado', () => {
  const company = createCompany({ name: 'Publishing', slug: buildUniqueSlug('publishing-company') });
  const draftProject = createProject({
    companyId: company.id,
    name: 'Draft Tower',
    slug: buildUniqueSlug('draft-tower'),
    status: 'DRAFT',
  });

  const publishedProject = createProject({
    companyId: company.id,
    name: 'Published Tower',
    slug: buildUniqueSlug('published-tower'),
    status: 'DRAFT',
  });

  const published = publishProject(publishedProject.id, {
    publicSlug: 'published-tower-public',
    publicUrl: '/proyecto/published-tower-public',
    title: 'Published Tower',
    description: 'Público',
    buttonText: 'Explorar',
  });

  assert.equal(published.status, 'PUBLISHED');
  assert.equal(listPublicProjects().some((entry) => entry.id === published.id), true);
  assert.equal(listPublicProjects().some((entry) => entry.id === draftProject.id), false);
  assert.equal(getProjectBySlug(publishedProject.slug, company.id)?.status, 'PUBLISHED');
});

test('5. debe aislar marcas y proyectos por empresa', () => {
  const companyA = createCompany({ name: 'Company A', slug: buildUniqueSlug('company-a') });
  const companyB = createCompany({ name: 'Company B', slug: buildUniqueSlug('company-b') });

  const sameSlug = buildUniqueSlug('shared-project');

  const projectA = createProject({
    companyId: companyA.id,
    name: 'Shared Project',
    slug: sameSlug,
    status: 'PUBLISHED',
  });

  const projectB = createProject({
    companyId: companyB.id,
    name: 'Shared Project',
    slug: sameSlug,
    status: 'PUBLISHED',
  });

  assert.equal(ensureCompanyAccess(companyA.id, companyA.id), true);
  assert.equal(ensureCompanyAccess(companyA.id, companyB.id), false);
  assert.equal(getProjectBySlug(sameSlug, companyA.id)?.id, projectA.id);
  assert.equal(getProjectBySlug(sameSlug, companyB.id)?.id, projectB.id);
});
