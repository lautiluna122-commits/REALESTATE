import test from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';

const { createAssetPath, maxServerUploadBytes, storageConfigured } = await import('../services/objectStorageService.js');

test('object storage creates tenant-scoped immutable asset paths', () => {
  const path = createAssetPath({ companyId: 'company-1', projectId: 'project-1', assetId: 'asset-1', filename: 'Mi render final.jpg' });
  assert.equal(path, 'companies/company-1/projects/project-1/assets/asset-1/Mi-render-final.jpg');
  assert.equal(path.includes('..'), false);
  assert.equal(path.includes('//'), false);
});

test('object storage rejects traversal and oversized server uploads', () => {
  assert.throws(() => createAssetPath({ companyId: 'c', projectId: 'p', assetId: 'a', filename: '../secret.txt' }), /invalid storage pathname/i);
  assert.equal(maxServerUploadBytes(), 4_500_000);
});

test('storage configuration is explicit', () => {
  const previous = process.env.BLOB_READ_WRITE_TOKEN;
  delete process.env.BLOB_READ_WRITE_TOKEN;
  assert.equal(storageConfigured(), false);
  if (previous !== undefined) process.env.BLOB_READ_WRITE_TOKEN = previous;
});
