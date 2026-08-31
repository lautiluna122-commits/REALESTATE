import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import Database from 'better-sqlite3';

const isTestEnv = process.env.NODE_ENV === 'test' || process.argv.some((arg) => arg.includes('--test'));
const dataDir = path.resolve(process.cwd(), 'server', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbFile = path.join(dataDir, isTestEnv ? 'platform.test.sqlite' : 'platform.sqlite');
if (isTestEnv && fs.existsSync(dbFile)) {
  fs.unlinkSync(dbFile);
}

const db = new Database(dbFile);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS companies (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    companyId TEXT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    createdAt TEXT NOT NULL,
    FOREIGN KEY(companyId) REFERENCES companies(id)
  );

  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    companyId TEXT NOT NULL,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'DRAFT',
    location TEXT,
    branding TEXT,
    buildingReference TEXT,
    environmentConfig TEXT,
    publicationConfig TEXT,
    createdAt TEXT NOT NULL,
    FOREIGN KEY(companyId) REFERENCES companies(id)
  );

  CREATE UNIQUE INDEX IF NOT EXISTS idx_projects_company_slug ON projects(companyId, slug);

  CREATE TABLE IF NOT EXISTS buildings (
    id TEXT PRIMARY KEY,
    projectId TEXT NOT NULL,
    name TEXT NOT NULL,
    reference TEXT,
    metadata TEXT,
    createdAt TEXT NOT NULL,
    FOREIGN KEY(projectId) REFERENCES projects(id)
  );

  CREATE TABLE IF NOT EXISTS floors (
    id TEXT PRIMARY KEY,
    projectId TEXT NOT NULL,
    buildingId TEXT NOT NULL,
    number INTEGER NOT NULL,
    name TEXT,
    metadata TEXT,
    createdAt TEXT NOT NULL,
    FOREIGN KEY(projectId) REFERENCES projects(id),
    FOREIGN KEY(buildingId) REFERENCES buildings(id)
  );

  CREATE TABLE IF NOT EXISTS units (
    id TEXT PRIMARY KEY,
    projectId TEXT NOT NULL,
    buildingId TEXT NOT NULL,
    floorId TEXT NOT NULL,
    number TEXT NOT NULL,
    surface REAL,
    bedrooms INTEGER,
    bathrooms INTEGER,
    terrace REAL,
    price REAL,
    currency TEXT NOT NULL DEFAULT 'USD',
    status TEXT NOT NULL DEFAULT 'AVAILABLE',
    description TEXT,
    planId TEXT,
    modelReference TEXT,
    images TEXT,
    createdAt TEXT NOT NULL,
    FOREIGN KEY(projectId) REFERENCES projects(id),
    FOREIGN KEY(buildingId) REFERENCES buildings(id),
    FOREIGN KEY(floorId) REFERENCES floors(id)
  );

  CREATE TABLE IF NOT EXISTS plans (
    id TEXT PRIMARY KEY,
    projectId TEXT NOT NULL,
    name TEXT NOT NULL,
    kind TEXT NOT NULL,
    filePath TEXT,
    description TEXT,
    createdAt TEXT NOT NULL,
    FOREIGN KEY(projectId) REFERENCES projects(id)
  );

  CREATE TABLE IF NOT EXISTS amenities (
    id TEXT PRIMARY KEY,
    projectId TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    createdAt TEXT NOT NULL,
    FOREIGN KEY(projectId) REFERENCES projects(id)
  );

  CREATE TABLE IF NOT EXISTS assets (
    id TEXT PRIMARY KEY,
    projectId TEXT NOT NULL,
    entityType TEXT,
    entityId TEXT,
    name TEXT NOT NULL,
    kind TEXT NOT NULL,
    path TEXT,
    url TEXT,
    mimeType TEXT,
    metadata TEXT,
    isPrimary INTEGER NOT NULL DEFAULT 0,
    createdAt TEXT NOT NULL,
    FOREIGN KEY(projectId) REFERENCES projects(id)
  );

  CREATE TABLE IF NOT EXISTS locations (
    id TEXT PRIMARY KEY,
    projectId TEXT NOT NULL,
    name TEXT,
    city TEXT,
    country TEXT,
    district TEXT,
    coordinates TEXT,
    createdAt TEXT NOT NULL,
    FOREIGN KEY(projectId) REFERENCES projects(id)
  );

  CREATE TABLE IF NOT EXISTS project_publications (
    id TEXT PRIMARY KEY,
    projectId TEXT NOT NULL UNIQUE,
    publicSlug TEXT NOT NULL,
    publicUrl TEXT,
    title TEXT NOT NULL,
    description TEXT,
    thumbnail TEXT,
    buttonText TEXT,
    isPublished INTEGER NOT NULL DEFAULT 0,
    customDomain TEXT,
    status TEXT NOT NULL DEFAULT 'DRAFT',
    createdAt TEXT NOT NULL,
    FOREIGN KEY(projectId) REFERENCES projects(id)
  );
`);

export function getDb() {
  return db;
}

export function getDbPath() {
  return dbFile;
}

export function seedDefaultTenantData() {
  const companyExists = db.prepare('SELECT id FROM companies WHERE slug = ? LIMIT 1').get('ocean-group');
  if (companyExists) {
    const projectExists = db.prepare('SELECT id FROM projects WHERE companyId = ? AND slug = ? LIMIT 1').get(companyExists.id, 'ocean-mansions');
    if (projectExists) {
      return;
    }
  }

  const companyId = companyExists?.id || crypto.randomUUID();
  const projectId = crypto.randomUUID();
  const buildingId = crypto.randomUUID();
  const floorId = crypto.randomUUID();

  const now = new Date().toISOString();

  if (!companyExists) {
    db.prepare(
      'INSERT OR IGNORE INTO companies (id, name, slug, status, createdAt) VALUES (?, ?, ?, ?, ?)',
    ).run(companyId, 'Ocean Group', 'ocean-group', 'ACTIVE', now);
  }

  const resolvedCompanyId = db.prepare('SELECT id FROM companies WHERE slug = ? LIMIT 1').get('ocean-group')?.id;
  if (!resolvedCompanyId) {
    return;
  }

  const projectExists = db.prepare('SELECT id FROM projects WHERE companyId = ? AND slug = ? LIMIT 1').get(resolvedCompanyId, 'ocean-mansions');
  if (!projectExists) {
    db.prepare(
      'INSERT OR IGNORE INTO projects (id, companyId, name, slug, description, status, location, branding, buildingReference, environmentConfig, publicationConfig, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    ).run(
      projectId,
      resolvedCompanyId,
      'Ocean Mansions',
      'ocean-mansions',
      'Proyecto de prueba para la plataforma.',
      'DRAFT',
      JSON.stringify({ city: 'Punta del Este', country: 'Uruguay', district: 'Playa Mansa' }),
      JSON.stringify({ primaryColor: '#173b63', secondaryColor: '#d4af69' }),
      'tower-a',
      JSON.stringify({ environment: ['ocean', 'beach', 'terrain', 'city'], experience: { walking: true, floorSelection: true, apartmentTour: true, dayNight: true } }),
      JSON.stringify({ publicSlug: 'ocean-mansions', publicUrl: '/proyecto/ocean-mansions', isPublished: false }),
      now,
    );
  }

  const projectRow = db.prepare('SELECT id FROM projects WHERE companyId = ? AND slug = ? LIMIT 1').get(resolvedCompanyId, 'ocean-mansions');
  if (!projectRow) {
    return;
  }

  const buildingExists = db.prepare('SELECT id FROM buildings WHERE projectId = ? AND reference = ? LIMIT 1').get(projectRow.id, 'tower-a');
  if (!buildingExists) {
    db.prepare(
      'INSERT OR IGNORE INTO buildings (id, projectId, name, reference, metadata, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
    ).run(buildingId, projectRow.id, 'Tower A', 'tower-a', JSON.stringify({ levels: 12 }), now);
  }

  const buildingResolvedId = db.prepare('SELECT id FROM buildings WHERE projectId = ? AND reference = ? LIMIT 1').get(projectRow.id, 'tower-a')?.id;
  if (!buildingResolvedId) {
    return;
  }

  const floorExists = db.prepare('SELECT id FROM floors WHERE projectId = ? AND buildingId = ? AND number = ? LIMIT 1').get(projectRow.id, buildingResolvedId, 8);
  if (!floorExists) {
    db.prepare(
      'INSERT OR IGNORE INTO floors (id, projectId, buildingId, number, name, metadata, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
    ).run(floorId, projectRow.id, buildingResolvedId, 8, 'Piso 8', JSON.stringify({ active: true }), now);
  }

  const floorResolvedId = db.prepare('SELECT id FROM floors WHERE projectId = ? AND buildingId = ? AND number = ? LIMIT 1').get(projectRow.id, buildingResolvedId, 8)?.id;
  if (!floorResolvedId) {
    return;
  }

  const unitExists = db.prepare('SELECT id FROM units WHERE projectId = ? AND floorId = ? AND number = ? LIMIT 1').get(projectRow.id, floorResolvedId, '804');
  if (!unitExists) {
    db.prepare(
      'INSERT OR IGNORE INTO units (id, projectId, buildingId, floorId, number, surface, bedrooms, bathrooms, terrace, price, currency, status, description, planId, modelReference, images, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    ).run(
      'unit-ocean-804',
      projectRow.id,
      buildingResolvedId,
      floorResolvedId,
      '804',
      128,
      3,
      2,
      24,
      485000,
      'USD',
      'AVAILABLE',
      'Unidad de prueba con terraza y vista al mar.',
      null,
      'ocean-mansions-building-model',
      JSON.stringify(['unit-804-1.jpg']),
      now,
    );
  }

  const publicationExists = db.prepare('SELECT id FROM project_publications WHERE projectId = ? LIMIT 1').get(projectRow.id);
  if (!publicationExists) {
    db.prepare(
      'INSERT OR IGNORE INTO project_publications (id, projectId, publicSlug, publicUrl, title, description, thumbnail, buttonText, isPublished, customDomain, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    ).run(
      'pub-ocean-mansions',
      projectRow.id,
      'ocean-mansions',
      '/proyecto/ocean-mansions',
      'Ocean Mansions',
      'Showroom inmobiliario 3D',
      '/assets/projects/ocean-mansions/thumbnail.jpg',
      'Explorar en 3D',
      0,
      '',
      'DRAFT',
      now,
    );
  }
}

seedDefaultTenantData();
