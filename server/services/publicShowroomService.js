import { getDb } from '../db.js';

const db = getDb();

function parseJson(value) {
  if (value === null || value === undefined || value === '') return null;
  try { return JSON.parse(value); } catch { return value; }
}

function normalizeProject(row) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    status: row.status,
    location: parseJson(row.location),
    branding: parseJson(row.branding),
    buildingReference: row.buildingReference,
    createdAt: row.createdAt,
  };
}

function normalizeUnit(row) {
  return { ...row, images: parseJson(row.images) ?? [] };
}

function normalizeAsset(row) {
  return { ...row, metadata: parseJson(row.metadata), isPrimary: Boolean(row.isPrimary) };
}

export function getPublishedShowroomBySlug(publicSlug) {
  const row = db.prepare(
    `SELECT p.*
     FROM projects p
     INNER JOIN project_publications pub ON pub.projectId = p.id
     WHERE pub.publicSlug = ? AND pub.isPublished = 1 AND pub.status = 'PUBLISHED' AND p.status = 'PUBLISHED'
     LIMIT 1`,
  ).get(publicSlug);

  if (!row) return null;

  const publication = db.prepare(
    `SELECT id, projectId, publicSlug, publicUrl, title, description, thumbnail, buttonText, isPublished, customDomain, status, createdAt
     FROM project_publications WHERE projectId = ?`,
  ).get(row.id);

  const buildings = db.prepare('SELECT id, projectId, name, reference, metadata, createdAt FROM buildings WHERE projectId = ? ORDER BY createdAt ASC').all(row.id)
    .map((item) => ({ ...item, metadata: parseJson(item.metadata) }));
  const floors = db.prepare('SELECT id, projectId, buildingId, number, name, metadata, createdAt FROM floors WHERE projectId = ? ORDER BY number ASC').all(row.id)
    .map((item) => ({ ...item, metadata: parseJson(item.metadata) }));
  const units = db.prepare(
    `SELECT u.id, u.projectId, u.buildingId, u.floorId, u.number, u.surface, u.bedrooms, u.bathrooms, u.terrace,
            u.price, u.currency, u.status, u.description, u.planId, u.modelReference, u.images, u.createdAt,
            f.number AS floor, f.name AS floorName, b.name AS buildingName, b.reference AS buildingReference
     FROM units u
     LEFT JOIN floors f ON f.id = u.floorId AND f.projectId = u.projectId
     LEFT JOIN buildings b ON b.id = u.buildingId AND b.projectId = u.projectId
     WHERE u.projectId = ?
     ORDER BY f.number ASC, u.number ASC`,
  ).all(row.id).map(normalizeUnit);
  const plans = db.prepare('SELECT id, projectId, name, kind, filePath, description, createdAt FROM plans WHERE projectId = ? ORDER BY createdAt ASC').all(row.id);
  const amenities = db.prepare('SELECT id, projectId, name, description, category, createdAt FROM amenities WHERE projectId = ? ORDER BY createdAt ASC').all(row.id);
  const assets = db.prepare('SELECT id, projectId, entityType, entityId, name, kind, path, url, mimeType, metadata, isPrimary, createdAt FROM assets WHERE projectId = ? ORDER BY createdAt ASC').all(row.id).map(normalizeAsset);
  const location = db.prepare('SELECT id, projectId, name, city, country, district, coordinates, createdAt FROM locations WHERE projectId = ? ORDER BY createdAt DESC LIMIT 1').get(row.id);

  return {
    project: normalizeProject(row),
    publication: publication ? { ...publication, isPublished: Boolean(publication.isPublished) } : null,
    buildings,
    floors,
    units,
    plans,
    amenities,
    assets,
    location: location ? { ...location, coordinates: parseJson(location.coordinates) } : null,
  };
}
