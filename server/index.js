import express from 'express';
import cors from 'cors';
import { getDb } from './db.js';
import {
  listCompanies,
  createCompany,
  listProjectsByCompany,
  createProject,
  getProjectById,
  getProjectBySlug,
  getPublishedProjectByPublicSlug,
  listPublicProjects,
  createBuilding,
  listProjectBuildings,
  createFloor,
  listProjectFloors,
  createUnit,
  listProjectUnits,
  getUnitById,
  updateUnit,
  createPlan,
  createAmenity,
  listProjectAmenities,
  createAsset,
  listProjectAssets,
  createLocation,
  getProjectLocation,
  createProjectPublication,
  publishProject,
  createLead,
  ensureCompanyAccess,
  getCompanyByApiKey,
} from './services/projectService.js';
import { requireOwnProject } from './middleware/tenantAccess.js';

const app = express();
const db = getDb();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: '5mb' }));

function requireApiKey(req, res, next) {
  const apiKey = req.header('x-api-key');
  if (!apiKey) return res.status(401).json({ message: 'x-api-key header required' });
  const company = getCompanyByApiKey(apiKey);
  if (!company) return res.status(401).json({ message: 'invalid api key' });
  req.company = company;
  next();
}

function requirePlatformKey(req, res, next) {
  const configuredKey = process.env.PLATFORM_API_KEY;
  if (!configuredKey) return res.status(503).json({ message: 'platform access is not configured' });
  const providedKey = req.header('x-platform-key');
  if (!providedKey || providedKey !== configuredKey) return res.status(401).json({ message: 'invalid platform key' });
  req.authScope = 'platform';
  next();
}

function requireOwnCompany(req, res, next) {
  if (!req.company || String(req.company.id) !== String(req.params.companyId)) {
    return res.status(403).json({ message: 'company mismatch' });
  }
  next();
}

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'real-estate-platform', timestamp: new Date().toISOString() });
});

app.get('/api/admin/companies', requirePlatformKey, (_req, res) => res.json(listCompanies()));
app.post('/api/admin/companies', requirePlatformKey, (req, res) => {
  const { name, slug } = req.body;
  if (!name || !slug) return res.status(400).json({ message: 'name and slug are required' });
  try { return res.status(201).json(createCompany({ name, slug })); }
  catch (error) { return res.status(400).json({ message: error.message }); }
});

app.use('/api/admin', requireApiKey);
app.get('/api/admin/companies/:companyId/projects', requireOwnCompany, (req, res) => {
  res.json(listProjectsByCompany(req.params.companyId));
});
app.post('/api/admin/projects', (req, res) => {
  const payload = req.body;
  if (!payload.companyId || !payload.name || !payload.slug) return res.status(400).json({ message: 'companyId, name and slug are required' });
  if (String(payload.companyId) !== String(req.company.id)) return res.status(403).json({ message: 'company mismatch' });
  try { return res.status(201).json(createProject(payload)); }
  catch (error) { return res.status(400).json({ message: error.message }); }
});
app.use('/api/admin/projects/:projectId', requireOwnProject);

app.get('/api/admin/projects/:projectId', (req, res) => res.json(req.project));
app.post('/api/admin/projects/:projectId/buildings', (req, res) => {
  const { name, reference, metadata } = req.body;
  if (!name) return res.status(400).json({ message: 'name required' });
  try { return res.status(201).json(createBuilding({ projectId: req.params.projectId, name, reference, metadata })); }
  catch (error) { return res.status(400).json({ message: error.message }); }
});
app.get('/api/admin/projects/:projectId/buildings', (req, res) => res.json(listProjectBuildings(req.params.projectId)));
app.post('/api/admin/projects/:projectId/floors', (req, res) => {
  const { buildingId, number, name, metadata } = req.body;
  if (!buildingId || Number.isNaN(Number(number))) return res.status(400).json({ message: 'buildingId and valid number are required' });
  try { return res.status(201).json(createFloor({ projectId: req.params.projectId, buildingId, number: Number(number), name, metadata })); }
  catch (error) { return res.status(400).json({ message: error.message }); }
});
app.get('/api/admin/projects/:projectId/floors', (req, res) => res.json(listProjectFloors(req.params.projectId, req.query.buildingId || null)));
app.post('/api/admin/projects/:projectId/units', (req, res) => {
  const payload = req.body;
  if (!payload.buildingId || !payload.floorId || !payload.number) return res.status(400).json({ message: 'buildingId, floorId and number are required' });
  try { return res.status(201).json(createUnit({ projectId: req.params.projectId, ...payload })); }
  catch (error) { return res.status(400).json({ message: error.message }); }
});
app.get('/api/admin/projects/:projectId/units', (req, res) => res.json(listProjectUnits(req.params.projectId)));
app.get('/api/admin/projects/:projectId/units/:unitId', (req, res) => {
  const unit = getUnitById(req.params.projectId, req.params.unitId);
  if (!unit) return res.status(404).json({ message: 'Unit not found' });
  res.json(unit);
});
app.patch('/api/admin/projects/:projectId/units/:unitId', (req, res) => {
  try { const unit = updateUnit(req.params.projectId, req.params.unitId, req.body); if (!unit) return res.status(404).json({ message: 'Unit not found' }); return res.json(unit); }
  catch (error) { return res.status(400).json({ message: error.message }); }
});
app.post('/api/admin/projects/:projectId/plans', (req, res) => {
  try { return res.status(201).json(createPlan({ projectId: req.params.projectId, ...req.body })); }
  catch (error) { return res.status(400).json({ message: error.message }); }
});
app.get('/api/admin/projects/:projectId/plans', (req, res) => res.json(db.prepare('SELECT * FROM plans WHERE projectId = ? ORDER BY createdAt ASC').all(req.params.projectId)));
app.post('/api/admin/projects/:projectId/amenities', (req, res) => {
  try { return res.status(201).json(createAmenity({ projectId: req.params.projectId, ...req.body })); }
  catch (error) { return res.status(400).json({ message: error.message }); }
});
app.get('/api/admin/projects/:projectId/amenities', (req, res) => res.json(listProjectAmenities(req.params.projectId)));
app.post('/api/admin/projects/:projectId/assets', (req, res) => {
  try { return res.status(201).json(createAsset({ projectId: req.params.projectId, ...req.body })); }
  catch (error) { return res.status(400).json({ message: error.message }); }
});
app.get('/api/admin/projects/:projectId/assets', (req, res) => res.json(listProjectAssets(req.params.projectId)));
app.post('/api/admin/projects/:projectId/location', (req, res) => {
  try { return res.status(201).json(createLocation({ projectId: req.params.projectId, ...req.body })); }
  catch (error) { return res.status(400).json({ message: error.message }); }
});
app.get('/api/admin/projects/:projectId/location', (req, res) => res.json(getProjectLocation(req.params.projectId)));
app.post('/api/admin/projects/:projectId/publication', (req, res) => {
  try { return res.status(201).json(createProjectPublication({ projectId: req.params.projectId, ...req.body })); }
  catch (error) { return res.status(400).json({ message: error.message }); }
});
app.post('/api/admin/projects/:projectId/publish', (req, res) => {
  try { const result = publishProject(req.params.projectId, req.body || {}); if (!result) return res.status(404).json({ message: 'Project not found' }); return res.json(result); }
  catch (error) { return res.status(400).json({ message: error.message }); }
});

app.use('/api/company', requireApiKey);
app.get('/api/company/:companyId/projects', requireOwnCompany, (req, res) => res.json(listProjectsByCompany(req.params.companyId)));
app.get('/api/company/:companyId/projects/:projectId', requireOwnCompany, (req, res) => {
  const project = getProjectById(req.params.projectId);
  if (!project) return res.status(404).json({ message: 'Project not found' });
  if (String(project.companyId) !== String(req.params.companyId)) return res.status(403).json({ message: 'Access denied' });
  res.json(project);
});

app.get('/api/platform/companies', requirePlatformKey, (_req, res) => res.json(listCompanies()));
app.get('/api/platform/companies/:companyId/projects', requirePlatformKey, (req, res) => res.json(listProjectsByCompany(req.params.companyId)));
app.get('/api/platform/projects/:projectId', requirePlatformKey, (req, res) => {
  const project = getProjectById(req.params.projectId);
  if (!project) return res.status(404).json({ message: 'Project not found' });
  res.json(project);
});

app.get('/api/public/projects', (_req, res) => res.json(listPublicProjects()));
app.get('/api/public/projects/:publicSlug', (req, res) => {
  try { const result = getPublishedProjectByPublicSlug(req.params.publicSlug); if (!result) return res.status(404).json({ message: 'Project not found or not published' }); return res.json(result); }
  catch (error) { return res.status(400).json({ message: error.message }); }
});

app.get('/api/projects/public/list', (_req, res) => res.json(listPublicProjects()));
app.get('/api/projects/public/:slug', (req, res) => {
  try { const result = getPublishedProjectByPublicSlug(req.params.slug); if (!result) return res.status(404).json({ message: 'Project not found or not published' }); return res.json(result); }
  catch (error) { return res.status(400).json({ message: error.message }); }
});
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
  try { return res.status(201).json(createLead({ name, email, phone, message, projectId: req.params.projectId, unitId })); }
  catch (error) { return res.status(/not found/i.test(error.message) ? 404 : 400).json({ message: error.message }); }
});

app.post('/api/auth/tenant-access', requireApiKey, (req, res) => {
  const { requestedCompanyId, targetCompanyId } = req.body;
  if (String(requestedCompanyId) !== String(req.company.id)) return res.status(403).json({ allowed: false });
  res.json({ allowed: ensureCompanyAccess(requestedCompanyId, targetCompanyId) });
});

app.listen(port, () => console.log(`Real Estate Platform API listening on http://localhost:${port}`));
