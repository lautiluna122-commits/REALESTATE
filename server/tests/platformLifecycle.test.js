import test from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';

const { createCompany, createProject } = await import('../services/projectService.js');
const {
  PROJECT_LIFECYCLE,
  createProjectVersion,
  listProjectVersions,
  transitionProject,
} = await import('../services/platformLifecycleService.js');

test('project lifecycle exposes the expected platform states', () => {
  assert.deepEqual(PROJECT_LIFECYCLE.DRAFT, ['PROCESSING', 'REVIEW']);
  assert.deepEqual(PROJECT_LIFECYCLE.REVIEW, ['APPROVED', 'PROCESSING', 'DRAFT']);
  assert.deepEqual(PROJECT_LIFECYCLE.APPROVED, ['PUBLISHED', 'REVIEW']);
});

test('project moves through review, approval and publication with version timestamps', () => {
  const company = createCompany({ name: 'Lifecycle Test', slug: `lifecycle-${Date.now()}` });
  const project = createProject({ companyId: company.id, name: 'Lifecycle Project', slug: `project-${Date.now()}` });
  const version = createProjectVersion(project.id, { project: { name: project.name }, inventory: [] }, 'test-user');

  assert.equal(transitionProject(project.id, 'REVIEW', { versionId: version.id }).status, 'REVIEW');
  const approved = transitionProject(project.id, 'APPROVED', { versionId: version.id, actor: 'test-user' });
  assert.equal(approved.status, 'APPROVED');
  assert.equal(transitionProject(project.id, 'PUBLISHED', { versionId: version.id }).status, 'PUBLISHED');

  const versions = listProjectVersions(project.id);
  assert.equal(versions[0].status, 'PUBLISHED');
  assert.ok(versions[0].approvedAt);
  assert.ok(versions[0].publishedAt);
});

test('invalid lifecycle transitions are rejected', () => {
  const company = createCompany({ name: 'Invalid Test', slug: `invalid-${Date.now()}` });
  const project = createProject({ companyId: company.id, name: 'Invalid Project', slug: `invalid-project-${Date.now()}` });

  assert.throws(() => transitionProject(project.id, 'PUBLISHED'), /Invalid lifecycle transition/);
});
