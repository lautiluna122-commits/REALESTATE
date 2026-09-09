import crypto from 'node:crypto';
import { getDb } from '../db.js';
import { validateProjectIntegrity } from './projectIntegrityService.js';

const db = getDb();
const json = (value) => JSON.stringify(value ?? {});
const parse = (value) => { try { return value ? JSON.parse(value) : {}; } catch { return {}; } };

export const PLAN_CATALOG = Object.freeze({
  essential: { setupFrom: 3500, monthly: 149, annual: 1490 },
  premium: { setupFrom: 6000, monthly: 249, annual: 2490 },
  enterprise: { setupFrom: 10000, monthlyFrom: 500, annualFrom: 5000 },
});

export const PROJECT_LIFECYCLE = Object.freeze({
  DRAFT: ['PROCESSING', 'REVIEW'],
  PROCESSING: ['REVIEW', 'DRAFT'],
  REVIEW: ['APPROVED', 'PROCESSING', 'DRAFT'],
  APPROVED: ['PUBLISHED', 'REVIEW'],
  PUBLISHED: ['ARCHIVED', 'APPROVED'],
  ARCHIVED: ['DRAFT'],
});

export const SERVICE_REQUEST_STATUS = Object.freeze(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'REJECTED']);

export function ensureLifecycleSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS project_versions (id TEXT PRIMARY KEY, projectId TEXT NOT NULL, version INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'DRAFT', snapshot TEXT NOT NULL, createdBy TEXT, approvedAt TEXT, publishedAt TEXT, createdAt TEXT NOT NULL, FOREIGN KEY(projectId) REFERENCES projects(id), UNIQUE(projectId, version));
    CREATE TABLE IF NOT EXISTS analytics_events (id TEXT PRIMARY KEY, projectId TEXT NOT NULL, sessionId TEXT, event TEXT NOT NULL, entityType TEXT, entityId TEXT, metadata TEXT, occurredAt TEXT NOT NULL, FOREIGN KEY(projectId) REFERENCES projects(id));
    CREATE INDEX IF NOT EXISTS idx_analytics_project_time ON analytics_events(projectId, occurredAt);
    CREATE INDEX IF NOT EXISTS idx_analytics_event ON analytics_events(projectId, event);
    CREATE TABLE IF NOT EXISTS subscriptions (id TEXT PRIMARY KEY, companyId TEXT NOT NULL, projectId TEXT, planCode TEXT NOT NULL, billingInterval TEXT NOT NULL DEFAULT 'year', status TEXT NOT NULL DEFAULT 'TRIAL', currency TEXT NOT NULL DEFAULT 'USD', amount REAL NOT NULL DEFAULT 0, startsAt TEXT NOT NULL, endsAt TEXT, renewalAt TEXT, createdAt TEXT NOT NULL, FOREIGN KEY(companyId) REFERENCES companies(id), FOREIGN KEY(projectId) REFERENCES projects(id));
    CREATE TABLE IF NOT EXISTS service_requests (id TEXT PRIMARY KEY, companyId TEXT NOT NULL, projectId TEXT, type TEXT NOT NULL, priority TEXT NOT NULL DEFAULT 'NORMAL', title TEXT NOT NULL, description TEXT, status TEXT NOT NULL DEFAULT 'OPEN', requestedBy TEXT, resolvedAt TEXT, createdAt TEXT NOT NULL, FOREIGN KEY(companyId) REFERENCES companies(id), FOREIGN KEY(projectId) REFERENCES projects(id));
  `);
}

export function validateProjectSnapshot(snapshot) {
  const value = snapshot ?? {};
  const project = value.project ?? {};
  const manifest = value.manifest ?? {};
  const errors = [];
  if (!project.name?.trim()) errors.push('Project name is required');
  if (!project.slug?.trim()) errors.push('Project slug is required');
  if (!project.location) errors.push('Project location is required');
  if (!manifest.project) errors.push('Showroom manifest project is required');
  if (!Array.isArray(value.assets)) errors.push('Assets must be an array');
  if (!Array.isArray(value.plans)) errors.push('Plans must be an array');
  if (!Array.isArray(value.inventory)) errors.push('Inventory must be an array');
  if (Array.isArray(value.assets)) {
    value.assets.forEach((asset, index) => {
      if (!asset?.name) errors.push(`Asset ${index + 1} is missing a name`);
      if (!asset?.kind) errors.push(`Asset ${index + 1} is missing a kind`);
      if (asset?.status === 'READY' && !asset?.path && !asset?.url) errors.push(`Asset ${index + 1} is marked READY without a path or URL`);
    });
  }
  if (Array.isArray(value.inventory)) {
    const seen = new Set();
    value.inventory.forEach((unit, index) => {
      if (!unit?.number) errors.push(`Inventory unit ${index + 1} is missing a number`);
      const key = `${unit?.floor ?? 'x'}:${unit?.number ?? index}`;
      if (seen.has(key)) errors.push(`Duplicate inventory unit ${key}`);
      seen.add(key);
    });
  }
  return { valid: errors.length === 0, errors };
}

export function transitionProject(projectId, nextStatus, { versionId = null, actor = null } = {}) {
  ensureLifecycleSchema();
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);
  if (!project) return null;
  const currentStatus = project.status || 'DRAFT';
  if (currentStatus === nextStatus) return { ...project, changed: false };
  const allowed = PROJECT_LIFECYCLE[currentStatus] ?? [];
  if (!allowed.includes(nextStatus)) throw new Error(`Invalid lifecycle transition: ${currentStatus} -> ${nextStatus}`);
  const version = versionId ? db.prepare('SELECT id, projectId, version, status, snapshot FROM project_versions WHERE id = ? AND projectId = ?').get(versionId, projectId) : null;
  if (versionId && !version) throw new Error('Version not found for project');
  if (['REVIEW', 'APPROVED', 'PUBLISHED'].includes(nextStatus)) {
    if (!version) throw new Error(`A project version is required before ${nextStatus}`);
    const validation = validateProjectSnapshot(parse(version.snapshot));
    if (!validation.valid) throw new Error(`Version validation failed: ${validation.errors.join('; ')}`);
    const integrity = validateProjectIntegrity(projectId);
    if (!integrity.valid) throw new Error(`Project integrity validation failed: ${integrity.errors.join('; ')}`);
  }
  if (nextStatus === 'APPROVED' && version.status !== 'REVIEW') throw new Error(`Version must be in REVIEW before approval (current: ${version.status})`);
  const now = new Date().toISOString();
  const updateProject = db.transaction(() => {
    db.prepare('UPDATE projects SET status = ? WHERE id = ?').run(nextStatus, projectId);
    if (versionId && nextStatus === 'REVIEW') db.prepare('UPDATE project_versions SET status = ? WHERE id = ?').run('REVIEW', versionId);
    if (versionId && nextStatus === 'APPROVED') db.prepare('UPDATE project_versions SET status = ?, approvedAt = ? WHERE id = ?').run('APPROVED', now, versionId);
    if (versionId && nextStatus === 'PUBLISHED') db.prepare('UPDATE project_versions SET status = ?, publishedAt = ? WHERE id = ?').run('PUBLISHED', now, versionId);
  });
  updateProject();
  return { ...project, status: nextStatus, changed: true, changedAt: now, changedBy: actor, versionId };
}

export function recordAnalyticsEvent(input) {
  ensureLifecycleSchema();
  const id = crypto.randomUUID();
  const occurredAt = input.occurredAt ?? new Date().toISOString();
  db.prepare('INSERT INTO analytics_events (id,projectId,sessionId,event,entityType,entityId,metadata,occurredAt) VALUES (?,?,?,?,?,?,?,?)').run(id,input.projectId,input.sessionId ?? null,input.event,input.entityType ?? null,input.entityId ?? null,json(input.metadata),occurredAt);
  return { id, ...input, occurredAt };
}

export function getProjectAnalytics(projectId, since = null) {
  ensureLifecycleSchema();
  const rows = since ? db.prepare('SELECT event, COUNT(*) AS count FROM analytics_events WHERE projectId = ? AND occurredAt >= ? GROUP BY event ORDER BY count DESC').all(projectId, since) : db.prepare('SELECT event, COUNT(*) AS count FROM analytics_events WHERE projectId = ? GROUP BY event ORDER BY count DESC').all(projectId);
  return { projectId, events: rows, total: rows.reduce((sum, row) => sum + row.count, 0) };
}

export function createProjectVersion(projectId, snapshot, createdBy = null) {
  ensureLifecycleSchema();
  const validation = validateProjectSnapshot(snapshot);
  const latest = db.prepare('SELECT MAX(version) AS version FROM project_versions WHERE projectId = ?').get(projectId)?.version ?? 0;
  const version = latest + 1;
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  db.prepare('INSERT INTO project_versions (id,projectId,version,status,snapshot,createdBy,createdAt) VALUES (?,?,?,?,?,?,?)').run(id,projectId,version,'DRAFT',json(snapshot),createdBy,createdAt);
  return { id, projectId, version, status: 'DRAFT', snapshot, validation, createdBy, createdAt };
}

export function listProjectVersions(projectId) {
  ensureLifecycleSchema();
  return db.prepare('SELECT * FROM project_versions WHERE projectId = ? ORDER BY version DESC').all(projectId).map((row) => ({ ...row, snapshot: parse(row.snapshot) }));
}

export function createSubscription(input) {
  ensureLifecycleSchema();
  const id = crypto.randomUUID();
  const startsAt = input.startsAt ?? new Date().toISOString();
  const createdAt = new Date().toISOString();
  db.prepare('INSERT INTO subscriptions (id,companyId,projectId,planCode,billingInterval,status,currency,amount,startsAt,endsAt,renewalAt,createdAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)').run(id,input.companyId,input.projectId ?? null,input.planCode,input.billingInterval ?? 'year',input.status ?? 'TRIAL',input.currency ?? 'USD',Number(input.amount ?? 0),startsAt,input.endsAt ?? null,input.renewalAt ?? null,createdAt);
  return { id, ...input, startsAt, createdAt };
}

export function getCompanySubscription(companyId, projectId = null) {
  ensureLifecycleSchema();
  const row = projectId ? db.prepare('SELECT * FROM subscriptions WHERE companyId = ? AND projectId = ? ORDER BY createdAt DESC LIMIT 1').get(companyId, projectId) : db.prepare('SELECT * FROM subscriptions WHERE companyId = ? ORDER BY createdAt DESC LIMIT 1').get(companyId);
  return row ?? null;
}

export function createServiceRequest(input) {
  ensureLifecycleSchema();
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const status = input.status ?? 'OPEN';
  if (!SERVICE_REQUEST_STATUS.includes(status)) throw new Error(`Invalid service request status: ${status}`);
  db.prepare('INSERT INTO service_requests (id,companyId,projectId,type,priority,title,description,status,requestedBy,createdAt) VALUES (?,?,?,?,?,?,?,?,?,?)').run(id,input.companyId,input.projectId ?? null,input.type,input.priority ?? 'NORMAL',input.title,input.description ?? '',status,input.requestedBy ?? null,createdAt);
  return { id, ...input, status, createdAt };
}

export function listServiceRequests(companyId, projectId = null) {
  ensureLifecycleSchema();
  return projectId ? db.prepare('SELECT * FROM service_requests WHERE companyId = ? AND projectId = ? ORDER BY createdAt DESC').all(companyId, projectId) : db.prepare('SELECT * FROM service_requests WHERE companyId = ? ORDER BY createdAt DESC').all(companyId);
}

export function updateServiceRequestStatus(companyId, requestId, status, actor = null) {
  ensureLifecycleSchema();
  if (!SERVICE_REQUEST_STATUS.includes(status)) throw new Error(`Invalid service request status: ${status}`);
  const existing = db.prepare('SELECT * FROM service_requests WHERE id = ? AND companyId = ?').get(requestId, companyId);
  if (!existing) return null;
  const resolvedAt = status === 'RESOLVED' ? (existing.resolvedAt ?? new Date().toISOString()) : null;
  db.prepare('UPDATE service_requests SET status = ?, resolvedAt = ? WHERE id = ? AND companyId = ?').run(status, resolvedAt, requestId, companyId);
  return { ...existing, status, resolvedAt, updatedBy: actor, updatedAt: new Date().toISOString() };
}

ensureLifecycleSchema();
