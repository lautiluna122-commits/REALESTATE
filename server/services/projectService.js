import { getDb } from '../db.js';
import crypto from 'node:crypto';

const db = getDb();

const withJson = (value) => (value === undefined || value === null ? null : JSON.stringify(value));
const fromJson = (value) => {
  if (value === null || value === undefined || value === '') return null;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

function ensureLeadsTable() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS leads (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      projectId TEXT NOT NULL,
      unitId TEXT,
      createdAt TEXT NOT NULL,
      FOREIGN KEY(projectId) REFERENCES projects(id),
      FOREIGN KEY(unitId) REFERENCES units(id)
    );
    CREATE INDEX IF NOT EXISTS idx_leads_project_createdAt ON leads(projectId, createdAt DESC);
  `);
}

ensureLeadsTable();

export function createCompany({ name, slug, status = 'ACTIVE' }) {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  db.prepare(
    'INSERT INTO companies (id, name, slug, status, createdAt) VALUES (?, ?, ?, ?, ?)',
  ).run(id, name, slug, status, now);
  return { id, name, slug, status, createdAt: now };
}

export function listCompanies() {
  return db.prepare('SELECT * FROM companies ORDER BY createdAt DESC').all();
}

export function createProject({ companyId, name, slug, description = '', status = 'DRAFT', location = null, branding = null, buildingReference = null, environmentConfig = null, publicationConfig = null }) {
  if (!companyId || !name || !slug) {
    throw new Error('companyId, name and slug are required');
  }

  const existingProject = db.prepare('SELECT id FROM projects WHERE companyId = ? AND slug = ? LIMIT 1').get(companyId, slug);
  if (existingProject) {
    throw new Error(`A project with slug "${slug}" already exists for this company.`);
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  db.prepare(
    'INSERT INTO projects (id, companyId, name, slug, description, status, location, branding, buildingReference, environmentConfig, publicationConfig, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
  ).run(
    id,
    companyId,
    name,
    slug,
    description,
    status,
    withJson(location),
    withJson(branding),
    buildingReference,
    withJson(environmentConfig),
    withJson(publicationConfig),
    now,
  );

  return {
    id,
    companyId,
    name,
    slug,
    description,
    status,
    location: fromJson(location),
    branding: fromJson(branding),
    buildingReference,
    environmentConfig: fromJson(environmentConfig),
    publicationConfig: fromJson(publicationConfig),
    createdAt: now,
  };
}

export function listProjectsByCompany(companyId) {
  return db.prepare('SELECT * FROM projects WHERE companyId = ? ORDER BY createdAt DESC').all(companyId).map((row) => normalizeProject(row));
}

export function getProjectById(projectId) {
  const row = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);
  return row ? normalizeProject(row) : null;
}

export function getProjectBySlug(slug, companyId = null) {
  const row = companyId
    ? db.prepare('SELECT * FROM projects WHERE companyId = ? AND slug = ? LIMIT 1').get(companyId, slug)
    : db.prepare('SELECT * FROM projects WHERE slug = ? LIMIT 1').get(slug);
  return row ? normalizeProject(row) : null;
}

export function getPublishedProjectByPublicSlug(publicSlug) {
  const row = db.prepare(
    `SELECT p.* FROM projects p
     INNER JOIN project_publications pub ON pub.projectId = p.id
     WHERE pub.publicSlug = ? AND pub.isPublished = 1 AND p.status = ?
     LIMIT 1`,
  ).get(publicSlug, 'PUBLISHED');
  
  if (!row) return null;

  const publication = db.prepare('SELECT * FROM project_publications WHERE projectId = ?').get(row.id);
  return {
    project: normalizeProject(row),
    publication: publication ? {
      ...publication,
      isPublished: Boolean(publication.isPublished),
      isPrimary: publication.isPrimary ? Boolean(publication.isPrimary) : undefined,
    } : null,
  };
}

export function listPublicProjects() {
  return db.prepare(
    'SELECT p.* FROM projects p INNER JOIN project_publications pub ON pub.projectId = p.id WHERE p.status = ? AND pub.isPublished = 1 ORDER BY p.createdAt DESC',
  ).all('PUBLISHED').map((row) => normalizeProject(row));
}

export function createBuilding({ projectId, name, reference = '', metadata = null }) {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  db.prepare(
    'INSERT INTO buildings (id, projectId, name, reference, metadata, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
  ).run(id, projectId, name, reference, withJson(metadata), now);

  return { id, projectId, name, reference, metadata: fromJson(metadata), createdAt: now };
}

export function listProjectBuildings(projectId) {
  if (!projectId) throw new Error('projectId is required');
  return db.prepare('SELECT * FROM buildings WHERE projectId = ? ORDER BY createdAt ASC').all(projectId);
}

export function createFloor({ projectId, buildingId, number, name = '', metadata = null }) {
  if (!projectId || !buildingId) throw new Error('projectId and buildingId are required');
  
  const project = db.prepare('SELECT id FROM projects WHERE id = ?').get(projectId);
  if (!project) throw new Error('Project not found');
  
  const building = db.prepare('SELECT projectId FROM buildings WHERE id = ?').get(buildingId);
  if (!building) throw new Error('Building not found');
  if (building.projectId !== projectId) {
    throw new Error('Building does not belong to this project');
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  db.prepare(
    'INSERT INTO floors (id, projectId, buildingId, number, name, metadata, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
  ).run(id, projectId, buildingId, number, name, withJson(metadata), now);

  return { id, projectId, buildingId, number, name, metadata: fromJson(metadata), createdAt: now };
}

export function listProjectFloors(projectId, buildingId = null) {
  const query = buildingId
    ? 'SELECT * FROM floors WHERE projectId = ? AND buildingId = ? ORDER BY number ASC'
    : 'SELECT * FROM floors WHERE projectId = ? ORDER BY number ASC';
  return db.prepare(query).all(projectId, ...(buildingId ? [buildingId] : []) );
}

export function createUnit({ projectId, buildingId, floorId, number, surface, bedrooms, bathrooms, terrace, price, currency = 'USD', status = 'AVAILABLE', description = '', planId = null, modelReference = '', images = [] }) {
  if (!projectId || !buildingId || !floorId) {
    throw new Error('projectId, buildingId, and floorId are required');
  }

  const project = db.prepare('SELECT id FROM projects WHERE id = ?').get(projectId);
  if (!project) throw new Error('Project not found');

  const building = db.prepare('SELECT projectId FROM buildings WHERE id = ?').get(buildingId);
  if (!building) throw new Error('Building not found');
  if (building.projectId !== projectId) {
    throw new Error('Building does not belong to this project');
  }

  const floor = db.prepare('SELECT projectId, buildingId FROM floors WHERE id = ?').get(floorId);
  if (!floor) throw new Error('Floor not found');
  if (floor.buildingId !== buildingId) {
    throw new Error('Floor does not belong to this building');
  }
  if (floor.projectId !== projectId) {
    throw new Error('Floor does not belong to this project');
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  db.prepare(
    'INSERT INTO units (id, projectId, buildingId, floorId, number, surface, bedrooms, bathrooms, terrace, price, currency, status, description, planId, modelReference, images, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
  ).run(
    id,
    projectId,
    buildingId,
    floorId,
    String(number),
    Number(surface) || 0,
    Number(bedrooms) || 0,
    Number(bathrooms) || 0,
    Number(terrace) || 0,
    Number(price) || 0,
    currency,
    status,
    description,
    planId,
    modelReference,
    withJson(images),
    now,
  );

  return {
    id,
    projectId,
    buildingId,
    floorId,
    number: String(number),
    surface: Number(surface) || 0,
    bedrooms: Number(bedrooms) || 0,
    bathrooms: Number(bathrooms) || 0,
    terrace: Number(terrace) || 0,
    price: Number(price) || 0,
    currency,
    status,
    description,
    planId,
    modelReference,
    images: Array.isArray(images) ? images : fromJson(images) ?? [],
    createdAt: now,
  };
}

export function listProjectUnits(projectId) {
  return db.prepare('SELECT * FROM units WHERE projectId = ? ORDER BY floorId, number ASC').all(projectId).map((unit) => normalizeUnit(unit));
}

export function getUnitById(projectId, unitId) {
  const row = db.prepare('SELECT * FROM units WHERE projectId = ? AND id = ?').get(projectId, unitId);
  return row ? normalizeUnit(row) : null;
}

export function updateUnit(projectId, unitId, updates) {
  if (!projectId || !unitId) {
    throw new Error('projectId and unitId are required');
  }

  const current = db.prepare('SELECT * FROM units WHERE id = ? AND projectId = ?').get(unitId, projectId);
  if (!current) return null;

  const immutableFields = ['projectId', 'buildingId', 'floorId'];
  const attemptedMutation = immutableFields.filter((field) => updates.hasOwnProperty(field) && updates[field] !== current[field]);
  
  if (attemptedMutation.length > 0) {
    throw new Error(`Cannot modify immutable fields: ${attemptedMutation.join(', ')}`);
  }

  const next = {
    ...normalizeUnit(current),
    ...updates,
    projectId: current.projectId,
    buildingId: current.buildingId,
    floorId: current.floorId,
  };

  db.prepare(
    `UPDATE units SET
      number = ?,
      surface = ?,
      bedrooms = ?,
      bathrooms = ?,
      terrace = ?,
      price = ?,
      currency = ?,
      status = ?,
      description = ?,
      planId = ?,
      modelReference = ?,
      images = ?
     WHERE id = ? AND projectId = ?`,
  ).run(
    String(next.number),
    Number(next.surface) || 0,
    Number(next.bedrooms) || 0,
    Number(next.bathrooms) || 0,
    Number(next.terrace) || 0,
    Number(next.price) || 0,
    next.currency,
    next.status,
    next.description,
    next.planId,
    next.modelReference,
    withJson(next.images),
    unitId,
    projectId,
  );

  return getUnitById(projectId, unitId);
}

export function createPlan({ projectId, name, kind = 'architectural', filePath = '', description = '' }) {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  db.prepare(
    'INSERT INTO plans (id, projectId, name, kind, filePath, description, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
  ).run(id, projectId, name, kind, filePath, description, now);
  return { id, projectId, name, kind, filePath, description, createdAt: now };
}

export function createAmenity({ projectId, name, description = '', category = 'common' }) {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  db.prepare(
    'INSERT INTO amenities (id, projectId, name, description, category, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
  ).run(id, projectId, name, description, category, now);
  return { id, projectId, name, description, category, createdAt: now };
}

export function listProjectAmenities(projectId) {
  return db.prepare('SELECT * FROM amenities WHERE projectId = ? ORDER BY createdAt ASC').all(projectId);
}

export function createAsset({ projectId, entityType = null, entityId = null, name, kind, path = '', url = '', mimeType = '', metadata = null, isPrimary = false }) {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  db.prepare(
    'INSERT INTO assets (id, projectId, entityType, entityId, name, kind, path, url, mimeType, metadata, isPrimary, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
  ).run(id, projectId, entityType, entityId, name, kind, path, url, mimeType, withJson(metadata), isPrimary ? 1 : 0, now);
  return { id, projectId, entityType, entityId, name, kind, path, url, mimeType, metadata: fromJson(metadata), isPrimary, createdAt: now };
}

export function listProjectAssets(projectId) {
  return db.prepare('SELECT * FROM assets WHERE projectId = ? ORDER BY createdAt ASC').all(projectId).map((row) => ({ ...row, metadata: fromJson(row.metadata), isPrimary: Boolean(row.isPrimary) }));
}

export function createLocation({ projectId, name, city, country, district = '', coordinates = null }) {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  db.prepare(
    'INSERT INTO locations (id, projectId, name, city, country, district, coordinates, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
  ).run(id, projectId, name, city, country, district, withJson(coordinates), now);
  return { id, projectId, name, city, country, district, coordinates: fromJson(coordinates), createdAt: now };
}

export function getProjectLocation(projectId) {
  const row = db.prepare('SELECT * FROM locations WHERE projectId = ?').get(projectId);
  return row ? { ...row, coordinates: fromJson(row.coordinates) } : null;
}

export function createProjectPublication({ projectId, publicSlug, publicUrl, title, description = '', thumbnail = '', buttonText = 'Explorar en 3D', isPublished = false, customDomain = '', status = 'DRAFT' }) {
  const project = getProjectById(projectId);
  if (!project) {
    throw new Error('Project not found');
  }

  const existingCompanySlug = db.prepare(
    `SELECT pp.id
     FROM project_publications pp
     INNER JOIN projects p ON p.id = pp.projectId
     WHERE p.companyId = ? AND pp.publicSlug = ? AND pp.projectId != ?
     LIMIT 1`,
  ).get(project.companyId, publicSlug, projectId);

  if (existingCompanySlug) {
    throw new Error(`A public slug "${publicSlug}" already exists for this company.`);
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const existing = db.prepare('SELECT * FROM project_publications WHERE projectId = ?').get(projectId);
  if (existing) {
    db.prepare(
      `UPDATE project_publications SET publicSlug = ?, publicUrl = ?, title = ?, description = ?, thumbnail = ?, buttonText = ?, isPublished = ?, customDomain = ?, status = ? WHERE projectId = ?`,
    ).run(publicSlug, publicUrl, title, description, thumbnail, buttonText, isPublished ? 1 : 0, customDomain, status, projectId);
    return { ...existing, publicSlug, publicUrl, title, description, thumbnail, buttonText, isPublished, customDomain, status };
  }

  db.prepare(
    'INSERT INTO project_publications (id, projectId, publicSlug, publicUrl, title, description, thumbnail, buttonText, isPublished, customDomain, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
  ).run(id, projectId, publicSlug, publicUrl, title, description, thumbnail, buttonText, isPublished ? 1 : 0, customDomain, status, now);

  return { id, projectId, publicSlug, publicUrl, title, description, thumbnail, buttonText, isPublished, customDomain, status, createdAt: now };
}

export function createLead({ name, email, phone = null, projectId, unitId = null }) {
  if (!projectId) throw new Error('projectId is required');

  const project = db.prepare('SELECT id FROM projects WHERE id = ?').get(projectId);
  if (!project) throw new Error('Project not found');

  if (unitId) {
    const unit = db.prepare('SELECT id FROM units WHERE id = ? AND projectId = ?').get(unitId, projectId);
    if (!unit) throw new Error('Unit not found for this project');
  }

  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  db.prepare(
    'INSERT INTO leads (id, name, email, phone, projectId, unitId, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
  ).run(id, name, email, phone || null, projectId, unitId || null, createdAt);

  return { id, name, email, phone: phone || null, projectId, unitId: unitId || null, createdAt };
}

export function publishProject(projectId, payload = {}) {
  const project = getProjectById(projectId);
  if (!project) return null;

  const publicSlug = payload.publicSlug || project.slug;
  const publicUrl = payload.publicUrl || `/proyecto/${publicSlug}`;

  db.prepare('UPDATE projects SET status = ? WHERE id = ?').run('PUBLISHED', projectId);
  const publication = createProjectPublication({
    projectId,
    publicSlug,
    publicUrl,
    title: payload.title || project.name,
    description: payload.description || project.description || '',
    thumbnail: payload.thumbnail || '',
    buttonText: payload.buttonText || 'Explorar en 3D',
    isPublished: true,
    customDomain: payload.customDomain || '',
    status: 'PUBLISHED',
  });

  return { ...project, status: 'PUBLISHED', publication };
}

export function ensureCompanyAccess(requestedCompanyId, targetCompanyId) {
  if (!requestedCompanyId || !targetCompanyId) return false;
  return String(requestedCompanyId) === String(targetCompanyId);
}

export function normalizeProject(row) {
  return {
    ...row,
    location: fromJson(row.location),
    branding: fromJson(row.branding),
    environmentConfig: fromJson(row.environmentConfig),
    publicationConfig: fromJson(row.publicationConfig),
  };
}

export function normalizeUnit(row) {
  return {
    ...row,
    images: fromJson(row.images) ?? [],
  };
}