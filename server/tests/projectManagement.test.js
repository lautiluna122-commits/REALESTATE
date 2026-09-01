import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { createCompany, createProject, createBuilding, createFloor, updateCompany, updateProject, updateBuilding, updateFloor, unpublishProject, publishProject } from '../services/projectService.js';

const slug = (prefix) => `${prefix}-${crypto.randomUUID().slice(0, 8)}`;

test('phase 2 update services remain scoped to their company and project', () => {
  const company = createCompany({ name: 'Initial', slug: slug('company') });
  const updatedCompany = updateCompany(company.id, { name: 'Updated', slug: company.slug });
  assert.equal(updatedCompany.name, 'Updated');

  const project = createProject({ companyId: company.id, name: 'Initial project', slug: slug('project') });
  assert.equal(updateProject(project.id, { name: 'Updated project' }).name, 'Updated project');

  const building = createBuilding({ projectId: project.id, name: 'Tower' });
  assert.equal(updateBuilding(project.id, building.id, { name: 'Updated tower' }).name, 'Updated tower');
  const floor = createFloor({ projectId: project.id, buildingId: building.id, number: 1 });
  assert.equal(updateFloor(project.id, floor.id, { number: 2 }).number, 2);
  assert.equal(updateFloor('other-project', floor.id, { number: 3 }), null);

  publishProject(project.id, { publicSlug: slug('public'), title: 'Updated project' });
  assert.equal(unpublishProject(project.id).status, 'DRAFT');
});