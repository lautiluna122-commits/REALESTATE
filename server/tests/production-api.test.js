import test from 'node:test';
import assert from 'node:assert/strict';

const BASE = process.env.PRODUCTION_API_BASE || 'https://tldhihhyiphqarijpgcm.supabase.co/functions/v1/realestate-api';


test('production API health', async () => {
  const response = await fetch(`${BASE}/health`);
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.status, 'ok');
  assert.equal(body.database, 'supabase');
});

test('protected admin API rejects unauthenticated access', async () => {
  const response = await fetch(`${BASE}/admin/me`);
  assert.equal(response.status, 401);
});

test('public project endpoint rejects unknown or unpublished slug', async () => {
  const response = await fetch(`${BASE}/public/projects/__reaLestate_missing_test_project__`);
  assert.equal(response.status, 404);
});

if (process.env.PRODUCTION_TEST_PROJECT_SLUG) {
  test('published showroom contract', async () => {
    const response = await fetch(`${BASE}/public/projects/${encodeURIComponent(process.env.PRODUCTION_TEST_PROJECT_SLUG)}`);
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.ok(body.project?.id);
    assert.ok(body.publication?.isPublished);
    assert.ok(Array.isArray(body.units));
  });
}

if (process.env.PRODUCTION_COMPANY_API_KEY && process.env.PRODUCTION_TEST_PROJECT_ID) {
  test('authenticated production project contract', async () => {
    const response = await fetch(`${BASE}/admin/projects/${encodeURIComponent(process.env.PRODUCTION_TEST_PROJECT_ID)}`, {
      headers: { 'x-api-key': process.env.PRODUCTION_COMPANY_API_KEY },
    });
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(String(body.id), String(process.env.PRODUCTION_TEST_PROJECT_ID));
  });
}
