import test from 'node:test';
import assert from 'node:assert/strict';

import { getProjectById, getProjectUnits, getProjectAmenities, getProjectLocation, resolveProjectAsset, hydratePublishedProject } from '../../src/platform/projectRegistry.js';

test('project registry hydrates the canonical project hierarchy from API data', () => {
  const project = hydratePublishedProject({ project: { id: 'test-project', name: 'Test Project', status: 'PUBLISHED' }, publication: { publicSlug: 'test-project', isPublished: true }, buildings: [{ id: 'building-1' }], floors: [{ id: 'floor-1', buildingId: 'building-1' }], units: [{ id: 'unit-101', floorId: 'floor-1' }], amenities: [{ id: 'pool' }], location: { city: 'Punta del Este' }, plans: [{ id: 'plan-1' }], assets: [{ id: 'model-1', kind: 'glb', path: '/models/test-project.glb', entityType: 'PROJECT', entityId: 'test-project' }] });
  assert.ok(project);
  assert.equal(project.id, 'test-project');
  assert.equal(getProjectById('missing-project'), null);
  assert.equal(getProjectUnits('test-project').length, 1);
  assert.equal(getProjectAmenities('test-project').length, 1);
  assert.equal(getProjectLocation('test-project').city, 'Punta del Este');
  assert.equal(resolveProjectAsset('test-project').source, 'real-model');
  assert.equal(resolveProjectAsset('test-project').fallback, false);
});

test('asset resolution uses a procedural fallback only for a known project', () => {
  hydratePublishedProject({ project: { id: 'fallback-project', name: 'Fallback Project' } });
  const asset = resolveProjectAsset('fallback-project');
  assert.ok(asset);
  assert.equal(asset.kind, 'glb');
  assert.equal(asset.path.includes('/assets/models/'), true);
  assert.equal(asset.fallback, true);
  assert.equal(resolveProjectAsset('unknown-project'), null);
});
