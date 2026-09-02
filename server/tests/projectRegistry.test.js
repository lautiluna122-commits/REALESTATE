import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getProjectById,
  getProjectUnits,
  getProjectAmenities,
  getProjectLocation,
  resolveProjectAsset,
} from '../../src/platform/projectRegistry.js';

test('project registry exposes the canonical project hierarchy', () => {
  const project = getProjectById('ocean-mansions');
  assert.ok(project);
  assert.equal(project.id, 'ocean-mansions');
  assert.ok(Array.isArray(project.units));
  assert.equal(project.units.length > 0, true);
  assert.equal(getProjectUnits('ocean-mansions').length, project.units.length);
  assert.ok(Array.isArray(getProjectAmenities('ocean-mansions')));
  assert.equal(getProjectAmenities('ocean-mansions').length, 4);
  assert.equal(getProjectLocation('ocean-mansions').city, 'Punta del Este');
});

test('asset resolution falls back gracefully when the real model is missing', () => {
  const asset = resolveProjectAsset('ocean-mansions');
  assert.ok(asset);
  assert.equal(asset.kind, 'glb');
  assert.equal(asset.path.includes('/assets/models/'), true);
});
