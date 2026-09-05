import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

const port = 4128;
const baseUrl = `http://127.0.0.1:${port}`;
const dataPath = path.resolve(process.cwd(), 'server', 'data', 'platform.test.sqlite');

function waitForServer(child) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Timed out waiting for API server')), 10000);
    const check = async () => {
      try {
        const response = await fetch(`${baseUrl}/api/health`);
        if (response.ok) {
          clearTimeout(timeout);
          resolve();
          return;
        }
      } catch {
        // The server is still starting.
      }
      setTimeout(check, 100);
    };

    child.once('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    check();
  });
}

async function createCompany(name) {
  const response = await fetch(`${baseUrl}/api/admin/companies`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name,
      slug: `${name.toLowerCase().replaceAll(' ', '-')}-${crypto.randomUUID().slice(0, 8)}`,
    }),
  });
  assert.equal(response.status, 201);
  return response.json();
}

test('auth por api key protege las rutas admin/company', async () => {
  const child = spawn(process.execPath, ['server/index.js'], {
    cwd: process.cwd(),
    env: { ...process.env, NODE_ENV: 'test', PORT: String(port) },
    stdio: 'ignore',
  });

  try {
    await waitForServer(child);
    const companyA = await createCompany('Company A');
    const companyB = await createCompany('Company B');

    const noKey = await fetch(`${baseUrl}/api/admin/companies/${companyA.id}/projects`);
    assert.equal(noKey.status, 401);

    const badKey = await fetch(`${baseUrl}/api/admin/companies/${companyA.id}/projects`, {
      headers: { 'x-api-key': 'not-a-real-key' },
    });
    assert.equal(badKey.status, 401);

    const wrongCompany = await fetch(`${baseUrl}/api/admin/companies/${companyA.id}/projects`, {
      headers: { 'x-api-key': companyB.apiKey },
    });
    assert.equal(wrongCompany.status, 403);

    const ownCompany = await fetch(`${baseUrl}/api/admin/companies/${companyA.id}/projects`, {
      headers: { 'x-api-key': companyA.apiKey },
    });
    assert.equal(ownCompany.status, 200);

    const companyRouteNoKey = await fetch(`${baseUrl}/api/company/${companyA.id}/projects`);
    assert.equal(companyRouteNoKey.status, 401);

    const companyRouteWrongCompany = await fetch(`${baseUrl}/api/company/${companyA.id}/projects`, {
      headers: { 'x-api-key': companyB.apiKey },
    });
    assert.equal(companyRouteWrongCompany.status, 403);

    const publicRoute = await fetch(`${baseUrl}/api/public/projects`);
    assert.equal(publicRoute.status, 200);
  } finally {
    child.kill('SIGTERM');
    fs.rmSync(dataPath, { force: true });
    fs.rmSync(`${dataPath}-shm`, { force: true });
    fs.rmSync(`${dataPath}-wal`, { force: true });
  }
});
