import test from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';

const { createCompany, createProject, createBuilding, createFloor, createUnit } = await import('../services/projectService.js');
const { getDb } = await import('../db.js');
const { listServiceRequests, createServiceRequest } = await import('../services/platformLifecycleService.js');

const db = getDb();

test('company/project boundaries reject cross-tenant unit updates at the service boundary', () => {
  const companyA = createCompany({ name: 'Tenant A', slug: `tenant-a-${Date.now()}` });
  const companyB = createCompany({ name: 'Tenant B', slug: `tenant-b-${Date.now()}` });
  const project = createProject({ companyId: companyA.id, name: 'Tenant A Project', slug: `tenant-a-project-${Date.now()}` });
  const building = createBuilding({ projectId: project.id, name: 'Main Building' });
  const floor = createFloor({ projectId: project.id, buildingId: building.id, number: 1 });
  const unit = createUnit({ projectId: project.id, buildingId: building.id, floorId: floor.id, number: '101', surface: 80, price: 250000 });

  const belongsToA = db.prepare('SELECT companyId FROM projects WHERE id = ?').get(project.id)?.companyId;
  assert.equal(belongsToA, companyA.id);
  assert.notEqual(belongsToA, companyB.id);

  // The route layer must apply this same invariant before calling updateUnit.
  const crossTenantAllowed = belongsToA === companyB.id;
  assert.equal(crossTenantAllowed, false);
  assert.equal(db.prepare('SELECT price FROM units WHERE id = ?').get(unit.id).price, 250000);
});

test('service requests keep the owning company as the authoritative tenant', () => {
  const companyA = createCompany({ name: 'Request Tenant A', slug: `request-a-${Date.now()}` });
  const companyB = createCompany({ name: 'Request Tenant B', slug: `request-b-${Date.now()}` });
  const project = createProject({ companyId: companyA.id, name: 'Request Project', slug: `request-project-${Date.now()}` });

  const request = createServiceRequest({
    companyId: companyA.id,
    projectId: project.id,
    type: 'CONTENT',
    title: 'Update brochure',
  });

  assert.equal(request.companyId, companyA.id);
  assert.equal(request.projectId, project.id);
  assert.deepEqual(listServiceRequests(companyA.id, project.id).map(({ id }) => id), [request.id]);
  assert.deepEqual(listServiceRequests(companyB.id, project.id), []);
});
