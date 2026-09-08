import test from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';

const { toPublicProject, toPublicUnit, toPublicAsset, toPublicPlan } = await import('../services/platformLifecycleRoutes.js');

test('public project omits tenant and internal persistence fields', () => {
  const result = toPublicProject({
    id: 'project-1', name: 'Ocean Mansions', slug: 'ocean-mansions', description: 'Public', status: 'PUBLISHED',
    companyId: 'secret-company', createdAt: 'secret-created-at', publicationConfig: { internal: true },
    location: { city: 'Punta del Este' }, branding: { primaryColor: '#123456' }, buildingReference: 'tower-a', environmentConfig: { experience: { dayNight: true } },
  });
  assert.equal(result.companyId, undefined);
  assert.equal(result.createdAt, undefined);
  assert.equal(result.publicationConfig, undefined);
  assert.equal(result.slug, 'ocean-mansions');
});

test('public unit omits internal model and persistence metadata', () => {
  const result = toPublicUnit({
    id: 'unit-804', buildingId: 'b1', floorId: 'f1', number: '804', surface: 128, bedrooms: 3, bathrooms: 2, terrace: 24,
    price: 485000, currency: 'USD', status: 'AVAILABLE', description: 'Public unit', planId: 'plan-1', images: ['/img.jpg'],
    modelReference: 'internal-model-reference', createdAt: 'secret-created-at', projectId: 'secret-project',
  });
  assert.equal(result.modelReference, undefined);
  assert.equal(result.createdAt, undefined);
  assert.equal(result.projectId, undefined);
  assert.deepEqual(result.images, ['/img.jpg']);
});

test('public asset and plan serializers omit internal metadata and timestamps', () => {
  const asset = toPublicAsset({ id: 'a1', entityType: 'unit', entityId: 'u1', name: 'render', kind: 'interiorRender', url: '/render.jpg', mimeType: 'image/jpeg', metadata: { sourcePath: '/private' }, path: '/private', createdAt: 'secret' });
  const plan = toPublicPlan({ id: 'p1', projectId: 'secret', name: 'Planta 804', kind: 'architectural', filePath: '/public/plans/804.pdf', description: 'Public plan', createdAt: 'secret' });
  assert.equal(asset.metadata, undefined);
  assert.equal(asset.path, undefined);
  assert.equal(asset.createdAt, undefined);
  assert.equal(plan.projectId, undefined);
  assert.equal(plan.createdAt, undefined);
  assert.equal(plan.filePath, '/public/plans/804.pdf');
});
