import express from 'express';
import cors from 'cors';
import { getDb } from './db.js';
import {
  listCompanies, createCompany, listProjectsByCompany, createProject, getProjectById,
  getPublishedProjectByPublicSlug, listPublicProjects, createBuilding, listProjectBuildings,
  createFloor, listProjectFloors, createUnit, listProjectUnits, getUnitById, updateUnit,
  createPlan, createAmenity, listProjectAmenities, createAsset, listProjectAssets,
  createLocation, getProjectLocation, createProjectPublication, publishProject, createLead,
  ensureCompanyAccess, getCompanyByApiKey,
} from './services/projectService.js';
import { requireOwnProject } from './middleware/tenantAccess.js';

const app = express();
const db = getDb();
const port = process.env.PORT || 4000;
app.use(cors());
app.use(express.json({ limit: '5mb' }));

function requireApiKey(req, res, next) {
  const key = req.header('x-api-key');
  if (!key) return res.status(401).json({ message: 'x-api-key header required' });
  const company = getCompanyByApiKey(key);
  if (!company) return res.status(401).json({ message: 'invalid api key' });
  req.company = company; next();
}
function requirePlatformKey(req, res, next) {
  const configured = process.env.PLATFORM_API_KEY;
  if (!configured) return res.status(503).json({ message: 'platform access is not configured' });
  if (req.header('x-platform-key') !== configured) return res.status(401).json({ message: 'invalid platform key' });
  req.authScope = 'platform'; next();
}
function requireOwnCompany(req, res, next) {
  if (!req.company || String(req.company.id) !== String(req.params.companyId)) return res.status(403).json({ message: 'company mismatch' });
  next();
}
function jsonBody(value) { return value === undefined || value === null ? null : JSON.stringify(value); }
function parseJson(value) { if (value === null || value === undefined || value === '') return null; try { return JSON.parse(value); } catch { return value; } }
function normalizeProjectRow(row) {
  if (!row) return null;
  return { ...row, location: parseJson(row.location), branding: parseJson(row.branding), environmentConfig: parseJson(row.environmentConfig), publicationConfig: parseJson(row.publicationConfig) };
}
function getPublication(projectId) {
  const row = db.prepare('SELECT * FROM project_publications WHERE projectId = ?').get(projectId);
  return row ? { ...row, isPublished: Boolean(row.isPublished) } : null;
}

app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'real-estate-platform', timestamp: new Date().toISOString() }));

app.get('/api/admin/companies', requirePlatformKey, (_req, res) => res.json(listCompanies()));
app.post('/api/admin/companies', requirePlatformKey, (req, res) => {
  const { name, slug } = req.body || {};
  if (!name || !slug) return res.status(400).json({ message: 'name and slug are required' });
  try { res.status(201).json(createCompany({ name, slug })); } catch (e) { res.status(400).json({ message: e.message }); }
});

app.use('/api/admin', requireApiKey);
app.get('/api/admin/me', (req, res) => res.json({ id: req.company.id, name: req.company.name, slug: req.company.slug, status: req.company.status }));
app.get('/api/admin/companies/:companyId/projects', requireOwnCompany, (req, res) => res.json(listProjectsByCompany(req.params.companyId)));
app.post('/api/admin/projects', (req, res) => {
  const payload = req.body || {};
  if (!payload.companyId || !payload.name || !payload.slug) return res.status(400).json({ message: 'companyId, name and slug are required' });
  if (String(payload.companyId) !== String(req.company.id)) return res.status(403).json({ message: 'company mismatch' });
  try { res.status(201).json(createProject(payload)); } catch (e) { res.status(400).json({ message: e.message }); }
});
app.use('/api/admin/projects/:projectId', requireOwnProject);
app.get('/api/admin/projects/:projectId', (req, res) => res.json(req.project));
app.patch('/api/admin/projects/:projectId', (req, res) => {
  const allowed = ['name', 'slug', 'description', 'status', 'location', 'branding', 'buildingReference', 'environmentConfig', 'publicationConfig'];
  const updates = Object.fromEntries(Object.entries(req.body || {}).filter(([k]) => allowed.includes(k)));
  if (updates.slug) {
    const conflict = db.prepare('SELECT id FROM projects WHERE companyId = ? AND slug = ? AND id != ?').get(req.company.id, updates.slug, req.params.projectId);
    if (conflict) return res.status(409).json({ message: 'project slug already exists for this company' });
  }
  const sets = Object.keys(updates).map((key) => `${key} = ?`);
  const values = Object.keys(updates).map((key) => ['location','branding','environmentConfig','publicationConfig'].includes(key) ? jsonBody(updates[key]) : updates[key]);
  if (sets.length) db.prepare(`UPDATE projects SET ${sets.join(', ')} WHERE id = ? AND companyId = ?`).run(...values, req.params.projectId, req.company.id);
  res.json(normalizeProjectRow(db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.projectId)));
});

app.post('/api/admin/projects/:projectId/buildings', (req, res) => { try { res.status(201).json(createBuilding({ projectId: req.params.projectId, ...req.body })); } catch (e) { res.status(400).json({ message: e.message }); } });
app.get('/api/admin/projects/:projectId/buildings', (req, res) => res.json(listProjectBuildings(req.params.projectId)));
app.post('/api/admin/projects/:projectId/floors', (req, res) => { try { res.status(201).json(createFloor({ projectId: req.params.projectId, ...req.body, number: Number(req.body.number) })); } catch (e) { res.status(400).json({ message: e.message }); } });
app.get('/api/admin/projects/:projectId/floors', (req, res) => res.json(listProjectFloors(req.params.projectId, req.query.buildingId || null)));
app.post('/api/admin/projects/:projectId/units', (req, res) => { try { res.status(201).json(createUnit({ projectId: req.params.projectId, ...req.body })); } catch (e) { res.status(400).json({ message: e.message }); } });
app.get('/api/admin/projects/:projectId/units', (req, res) => res.json(listProjectUnits(req.params.projectId)));
app.get('/api/admin/projects/:projectId/units/:unitId', (req, res) => { const u = getUnitById(req.params.projectId, req.params.unitId); return u ? res.json(u) : res.status(404).json({ message: 'Unit not found' }); });
app.patch('/api/admin/projects/:projectId/units/:unitId', (req, res) => { try { const u = updateUnit(req.params.projectId, req.params.unitId, req.body || {}); return u ? res.json(u) : res.status(404).json({ message: 'Unit not found' }); } catch (e) { return res.status(400).json({ message: e.message }); } });

app.post('/api/admin/projects/:projectId/plans', (req, res) => { try { res.status(201).json(createPlan({ projectId: req.params.projectId, ...req.body })); } catch (e) { res.status(400).json({ message: e.message }); } });
app.get('/api/admin/projects/:projectId/plans', (req, res) => res.json(db.prepare('SELECT * FROM plans WHERE projectId = ? ORDER BY createdAt ASC').all(req.params.projectId)));
app.post('/api/admin/projects/:projectId/amenities', (req, res) => { try { res.status(201).json(createAmenity({ projectId: req.params.projectId, ...req.body })); } catch (e) { res.status(400).json({ message: e.message }); } });
app.get('/api/admin/projects/:projectId/amenities', (req, res) => res.json(listProjectAmenities(req.params.projectId)));
app.post('/api/admin/projects/:projectId/assets', (req, res) => { try { res.status(201).json(createAsset({ projectId: req.params.projectId, ...req.body })); } catch (e) { res.status(400).json({ message: e.message }); } });
app.get('/api/admin/projects/:projectId/assets', (req, res) => res.json(listProjectAssets(req.params.projectId)));
app.post('/api/admin/projects/:projectId/location', (req, res) => { try { res.status(201).json(createLocation({ projectId: req.params.projectId, ...req.body })); } catch (e) { res.status(400).json({ message: e.message }); } });
app.get('/api/admin/projects/:projectId/location', (req, res) => res.json(getProjectLocation(req.params.projectId)));

app.get('/api/admin/projects/:projectId/publication', (req, res) => res.json(getPublication(req.params.projectId)));
app.post('/api/admin/projects/:projectId/publication', (req, res) => { try { res.status(201).json(createProjectPublication({ projectId: req.params.projectId, ...req.body })); } catch (e) { res.status(400).json({ message: e.message }); } });
app.patch('/api/admin/projects/:projectId/publication', (req, res) => {
  const current = getPublication(req.params.projectId);
  if (!current) return res.status(404).json({ message: 'Publication not configured' });
  const allowed = ['publicSlug','publicUrl','title','description','thumbnail','buttonText','customDomain'];
  const entries = Object.entries(req.body || {}).filter(([k]) => allowed.includes(k));
  if (!entries.length) return res.json(current);
  if (entries.some(([k]) => k === 'publicSlug')) {
    const slug = entries.find(([k]) => k === 'publicSlug')[1];
    const conflict = db.prepare('SELECT id FROM project_publications WHERE publicSlug = ? AND projectId != ?').get(slug, req.params.projectId);
    if (conflict) return res.status(409).json({ message: 'public slug already in use' });
  }
  const sets = entries.map(([k]) => `${k} = ?`).join(', ');
  db.prepare(`UPDATE project_publications SET ${sets} WHERE projectId = ?`).run(...entries.map(([,v]) => v), req.params.projectId);
  res.json(getPublication(req.params.projectId));
});
app.post('/api/admin/projects/:projectId/publish', (req, res) => { try { const r = publishProject(req.params.projectId, req.body || {}); res.json(r); } catch (e) { res.status(400).json({ message: e.message }); } });
app.post('/api/admin/projects/:projectId/unpublish', (req, res) => {
  const pub = getPublication(req.params.projectId);
  if (!pub) return res.status(404).json({ message: 'Publication not configured' });
  db.prepare('UPDATE project_publications SET isPublished = 0, status = ? WHERE projectId = ?').run('DRAFT', req.params.projectId);
  db.prepare('UPDATE projects SET status = ? WHERE id = ?').run('DRAFT', req.params.projectId);
  res.json(getPublication(req.params.projectId));
});

app.get('/api/admin/projects/:projectId/leads', (req, res) => res.json(db.prepare('SELECT * FROM leads WHERE projectId = ? ORDER BY createdAt DESC').all(req.params.projectId)));

app.use('/api/company', requireApiKey);
app.get('/api/company/:companyId/projects', requireOwnCompany, (req, res) => res.json(listProjectsByCompany(req.params.companyId)));
app.get('/api/company/:companyId/projects/:projectId', requireOwnCompany, (req, res) => { const p = getProjectById(req.params.projectId); if (!p) return res.status(404).json({ message: 'Project not found' }); if (String(p.companyId) !== String(req.params.companyId)) return res.status(403).json({ message: 'Access denied' }); res.json(p); });

app.get('/api/platform/companies', requirePlatformKey, (_req, res) => res.json(listCompanies()));
app.get('/api/platform/companies/:companyId/projects', requirePlatformKey, (req, res) => res.json(listProjectsByCompany(req.params.companyId)));
app.get('/api/platform/projects/:projectId', requirePlatformKey, (req, res) => { const p = getProjectById(req.params.projectId); return p ? res.json(p) : res.status(404).json({ message: 'Project not found' }); });
app.get('/api/platform/projects/:projectId/units', requirePlatformKey, (req, res) => res.json(listProjectUnits(req.params.projectId)));
app.get('/api/platform/projects/:projectId/leads', requirePlatformKey, (req, res) => res.json(db.prepare('SELECT * FROM leads WHERE projectId = ? ORDER BY createdAt DESC').all(req.params.projectId)));

app.get('/api/public/projects', (_req, res) => res.json(listPublicProjects()));
app.get('/api/public/projects/:publicSlug', (req, res) => { const r = getPublishedProjectByPublicSlug(req.params.publicSlug); return r ? res.json(r) : res.status(404).json({ message: 'Project not found or not published' }); });
app.get('/api/projects/public/list', (_req, res) => res.json(listPublicProjects()));
app.get('/api/projects/public/:slug', (req, res) => { const r = getPublishedProjectByPublicSlug(req.params.slug); return r ? res.json(r) : res.status(404).json({ message: 'Project not found or not published' }); });

app.post('/api/projects/:projectId/leads', (req, res) => {
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const phone = typeof req.body?.phone === 'string' ? req.body.phone.trim() : null;
  const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
  const { unitId = null } = req.body || {};
  if (name.length < 2 || name.length > 120) return res.status(400).json({ message: 'name must be between 2 and 120 characters' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return res.status(400).json({ message: 'valid email is required' });
  if (phone !== null && (phone.length > 40 || phone.length === 0)) return res.status(400).json({ message: 'phone must be a non-empty value up to 40 characters' });
  if (unitId !== null && typeof unitId !== 'string') return res.status(400).json({ message: 'unitId must be a string or null' });
  try { res.status(201).json(createLead({ name, email, phone, message, projectId: req.params.projectId, unitId })); } catch (e) { res.status(/not found/i.test(e.message) ? 404 : 400).json({ message: e.message }); }
});
app.post('/api/auth/tenant-access', requireApiKey, (req, res) => { const { requestedCompanyId, targetCompanyId } = req.body || {}; if (String(requestedCompanyId) !== String(req.company.id)) return res.status(403).json({ allowed: false }); res.json({ allowed: ensureCompanyAccess(requestedCompanyId, targetCompanyId) }); });

app.listen(port, () => console.log(`Real Estate Platform API listening on http://localhost:${port}`));
