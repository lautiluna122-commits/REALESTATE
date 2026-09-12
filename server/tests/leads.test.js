import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import { spawn } from 'node:child_process';
import Database from 'better-sqlite3';

const port = 4127;
const baseUrl = `http://127.0.0.1:${port}`;

function waitForServer(child) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Timed out waiting for API server')), 10000);
    const check = async () => {
      try {
        const response = await fetch(`${baseUrl}/api/health`);
        if (response.ok) { clearTimeout(timeout); resolve(); return; }
      } catch {}
      setTimeout(check, 100);
    };
    child.once('error', error => { clearTimeout(timeout); reject(error); });
    check();
  });
}

test('POST /api/projects/:projectId/leads guarda correctamente el lead', async () => {
  const { getDbPath } = await import('../db.js');
  const { createCompany, createProject, publishProject } = await import('../services/projectService.js');
  const dataPath = getDbPath();
  const company = createCompany({ name: 'Lead Test Company', slug: `lead-test-${crypto.randomUUID().slice(0, 8)}` });
  const project = createProject({ companyId: company.id, name: 'Lead Test Project', slug: `lead-project-${crypto.randomUUID().slice(0, 8)}` });
  publishProject(project.id, { publicSlug: project.slug });
  const child = spawn(process.execPath, ['server/index.js'], {
    cwd: process.cwd(),
    env: { ...process.env, NODE_ENV: 'development', PORT: String(port), TEST_DB_FILE: dataPath },
    stdio: 'ignore',
  });
  try {
    await waitForServer(child);
    const leadPayload = { name: 'Ana Pérez', email: 'ana@example.com', phone: '+598 99 123 456' };
    const leadResponse = await fetch(`${baseUrl}/api/projects/${project.id}/leads`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(leadPayload) });
    assert.equal(leadResponse.status, 201);
    const lead = await leadResponse.json();
    assert.equal(lead.name, leadPayload.name);
    assert.equal(lead.email, leadPayload.email);
    assert.equal(lead.phone, leadPayload.phone);
    assert.equal(lead.projectId, project.id);
    assert.equal(lead.unitId, null);
    assert.match(lead.id, /^[0-9a-f-]{36}$/);
    assert.equal(Number.isNaN(Date.parse(lead.createdAt)), false);
    const db = new Database(dataPath, { readonly: true });
    try {
      const row = db.prepare('SELECT id, name, email, phone, message, projectId, unitId, createdAt FROM leads WHERE id = ?').get(lead.id);
      assert.deepEqual(row, lead);
    } finally { db.close(); }
  } finally {
    child.kill('SIGTERM');
    for (const suffix of ['', '-shm', '-wal']) fs.rmSync(`${dataPath}${suffix}`, { force: true });
  }
});
