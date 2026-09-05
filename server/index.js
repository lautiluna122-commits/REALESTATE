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
} from './services/projectService.js';

const app = express();
const db = getDb();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: '5mb' }));

// ============================================================
// HEALTH CHECK
// ============================================================

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'real-estate-platform', timestamp: new Date().toISOString() });
});

// ============================================================
// ADMIN ROUTES - Full management access (REQUIRE AUTH LATER)
// ============================================================

app.get('/api/admin/companies', (_req, res) => {
  res.json(listCompanies());
});

app.post('/api/admin/companies', (req, res) => {
  const { name, slug } = req.body;
  if (!name || !slug) {
    return res.status(400).json({ message: 'name and slug are required' });
  }
  try {
    const company = createCompany({ name, slug });
    return res.status(201).json(company);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.get('/api/admin/companies/:companyId/projects', (req, res) => {
  res.json(listProjectsByCompany(req.params.companyId));
});

app.post('/api/admin/projects', (req, res) => {
  const payload = req.body;
  if (!payload.companyId || !payload.name || !payload.slug) {
    return res.status(400).json({ message: 'companyId, name and slug are required' });
  }
  try {
    const project = createProject(payload);
    return res.status(201).json(project);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.get('/api/admin/projects/:projectId', (req, res) => {
  const project = getProjectById(req.params.projectId);
  if (!project) return res.status(404).json({ message: 'Project not found' });
  res.json(project);
});

app.post('/api/admin/projects/:projectId/buildings', (req, res) => {
  const { name, reference, metadata } = req.body;
  if (!name) return res.status(400).json({ message: 'name required' });
  try {
    const building = createBuilding({ projectId: req.params.projectId, name, reference, metadata });
    res.status(201).json(building);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.get('/api/admin/projects/:projectId/buildings', (req, res) => {
  try {
    res.json(listProjectBuildings(req.params.projectId));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.post('/api/admin/projects/:projectId/floors', (req, res) => {
  const { buildingId, number, name, metadata } = req.body;
  if (!buildingId || Number.isNaN(Number(number))) {
    return res.status(400).json({ message: 'buildingId and valid number are required' });
  }
  try {
    const floor = createFloor({ projectId: req.params.projectId, buildingId, number: Number(number), name, metadata });
    res.status(201).json(floor);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.get('/api/admin/projects/:projectId/floors', (req, res) => {
  const { buildingId } = req.query;
  res.json(listProjectFloors(req.params.projectId, buildingId || null));
});

app.post('/api/admin/projects/:projectId/units', (req, res) => {
  const payload = req.body;
  if (!payload.buildingId || !payload.floorId || !payload.number) {
    return res.status(400).json({ message: 'buildingId, floorId and number are required' });
  }
  try {
    const unit = createUnit({ projectId: req.params.projectId, ...payload });
    return res.status(201).json(unit);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.get('/api/admin/projects/:projectId/units', (req, res) => {
  res.json(listProjectUnits(req.params.projectId));
});

app.get('/api/admin/projects/:projectId/units/:unitId', (req, res) => {
  const unit = getUnitById(req.params.projectId, req.params.unitId);
  if (!unit) return res.status(404).json({ message: 'Unit not found' });
  res.json(unit);
});

app.patch('/api/admin/projects/:projectId/units/:unitId', (req, res) => {
  try {
    const unit = updateUnit(req.params.projectId, req.params.unitId, req.body);
    if (!unit) return res.status(404).json({ message: 'Unit not found' });
    res.json(unit);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.post('/api/admin/projects/:projectId/plans', (req, res) => {
  try {
    const plan = createPlan({ projectId: req.params.projectId, ...req.body });
    res.status(201).json(plan);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.get('/api/admin/projects/:projectId/plans', (req, res) => {
  res.json(db.prepare('SELECT * FROM plans WHERE projectId = ? ORDER BY createdAt ASC').all(req.params.projectId));
});

app.post('/api/admin/projects/:projectId/amenities', (req, res) => {
  try {
    const amenity = createAmenity({ projectId: req.params.projectId, ...req.body });
    res.status(201).json(amenity);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.get('/api/admin/projects/:projectId/amenities', (req, res) => {
  res.json(listProjectAmenities(req.params.projectId));
});

app.post('/api/admin/projects/:projectId/assets', (req, res) => {
  try {
    const asset = createAsset({ projectId: req.params.projectId, ...req.body });
    res.status(201).json(asset);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.get('/api/admin/projects/:projectId/assets', (req, res) => {
  res.json(listProjectAssets(req.params.projectId));
});

app.post('/api/admin/projects/:projectId/location', (req, res) => {
  try {
    const location = createLocation({ projectId: req.params.projectId, ...req.body });
    res.status(201).json(location);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.get('/api/admin/projects/:projectId/location', (req, res) => {
  res.json(getProjectLocation(req.params.projectId));
});

app.post('/api/admin/projects/:projectId/publication', (req, res) => {
  try {
    const publication = createProjectPublication({ projectId: req.params.projectId, ...req.body });
    res.status(201).json(publication);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.post('/api/admin/projects/:projectId/publish', (req, res) => {
  try {
    const result = publishProject(req.params.projectId, req.body || {});
    if (!result) return res.status(404).json({ message: 'Project not found' });
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// ============================================================
// COMPANY ROUTES - Tenant-specific access
// ============================================================

app.get('/api/company/:companyId/projects', (req, res) => {
  try {
    res.json(listProjectsByCompany(req.params.companyId));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.get('/api/company/:companyId/projects/:projectId', (req, res) => {
  try {
    const project = getProjectById(req.params.projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (project.companyId !== req.params.companyId) {
      return res.status(403).json({ message: 'Access denied' });
    }
    res.json(project);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// ============================================================
// PUBLIC ROUTES - Showroom / Read-only access
// ============================================================

app.get('/api/public/projects', (_req, res) => {
  res.json(listPublicProjects());
});

app.get('/api/public/projects/:publicSlug', (req, res) => {
  try {
    const result = getPublishedProjectByPublicSlug(req.params.publicSlug);
    if (!result) {
      return res.status(404).json({ message: 'Project not found or not published' });
    }
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// ============================================================
// LEGACY ROUTES (backwards compatibility during transition)
// ============================================================

app.get('/api/companies', (_req, res) => {
  res.json(listCompanies());
});

app.post('/api/companies', (req, res) => {
  const { name, slug } = req.body;
  if (!name || !slug) {
    return res.status(400).json({ message: 'name and slug are required' });
  }
  try {
    const company = createCompany({ name, slug });
    return res.status(201).json(company);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.get('/api/companies/:companyId/projects', (req, res) => {
  res.json(listProjectsByCompany(req.params.companyId));
});

app.post('/api/projects', (req, res) => {
  const payload = req.body;
  if (!payload.companyId || !payload.name || !payload.slug) {
    return res.status(400).json({ message: 'companyId, name and slug are required' });
  }
  try {
    const project = createProject(payload);
    return res.status(201).json(project);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.get('/api/projects/:projectId', (req, res) => {
  const project = getProjectById(req.params.projectId);
  if (!project) return res.status(404).json({ message: 'Project not found' });
  res.json(project);
});

app.get('/api/projects/slug/:slug', (req, res) => {
  const project = getProjectBySlug(req.params.slug);
  if (!project) return res.status(404).json({ message: 'Project not found' });
  res.json(project);
});

app.get('/api/projects/public/list', (_req, res) => {
  res.json(listPublicProjects());
});

app.post('/api/projects/:projectId/buildings', (req, res) => {
  const { name, reference, metadata } = req.body;
  if (!name) return res.status(400).json({ message: 'name required' });
  try {
    const building = createBuilding({ projectId: req.params.projectId, name, reference, metadata });
    res.status(201).json(building);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.get('/api/projects/:projectId/buildings', (req, res) => {
  try {
    res.json(listProjectBuildings(req.params.projectId));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.post('/api/projects/:projectId/floors', (req, res) => {
  const { buildingId, number, name, metadata } = req.body;
  if (!buildingId || Number.isNaN(Number(number))) {
    return res.status(400).json({ message: 'buildingId and valid number are required' });
  }
  try {
    const floor = createFloor({ projectId: req.params.projectId, buildingId, number: Number(number), name, metadata });
    res.status(201).json(floor);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.get('/api/projects/:projectId/floors', (req, res) => {
  const { buildingId } = req.query;
  res.json(listProjectFloors(req.params.projectId, buildingId || null));
});

app.post('/api/projects/:projectId/units', (req, res) => {
  const payload = req.body;
  if (!payload.buildingId || !payload.floorId || !payload.number) {
    return res.status(400).json({ message: 'buildingId, floorId and number are required' });
  }
  try {
    const unit = createUnit({ projectId: req.params.projectId, ...payload });
    return res.status(201).json(unit);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.get('/api/projects/:projectId/units', (req, res) => {
  res.json(listProjectUnits(req.params.projectId));
});

app.get('/api/projects/:projectId/units/:unitId', (req, res) => {
  const unit = getUnitById(req.params.projectId, req.params.unitId);
  if (!unit) return res.status(404).json({ message: 'Unit not found' });
  res.json(unit);
});

app.patch('/api/projects/:projectId/units/:unitId', (req, res) => {
  try {
    const unit = updateUnit(req.params.projectId, req.params.unitId, req.body);
    if (!unit) return res.status(404).json({ message: 'Unit not found' });
    res.json(unit);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.post('/api/projects/:projectId/plans', (req, res) => {
  try {
    const plan = createPlan({ projectId: req.params.projectId, ...req.body });
    res.status(201).json(plan);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.get('/api/projects/:projectId/plans', (req, res) => {
  res.json(db.prepare('SELECT * FROM plans WHERE projectId = ? ORDER BY createdAt ASC').all(req.params.projectId));
});

app.post('/api/projects/:projectId/amenities', (req, res) => {
  try {
    const amenity = createAmenity({ projectId: req.params.projectId, ...req.body });
    res.status(201).json(amenity);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.get('/api/projects/:projectId/amenities', (req, res) => {
  res.json(listProjectAmenities(req.params.projectId));
});

app.post('/api/projects/:projectId/assets', (req, res) => {
  try {
    const asset = createAsset({ projectId: req.params.projectId, ...req.body });
    res.status(201).json(asset);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.get('/api/projects/:projectId/assets', (req, res) => {
  res.json(listProjectAssets(req.params.projectId));
});

app.post('/api/projects/:projectId/location', (req, res) => {
  try {
    const location = createLocation({ projectId: req.params.projectId, ...req.body });
    res.status(201).json(location);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.get('/api/projects/:projectId/location', (req, res) => {
  res.json(getProjectLocation(req.params.projectId));
});

app.post('/api/projects/:projectId/publication', (req, res) => {
  try {
    const publication = createProjectPublication({ projectId: req.params.projectId, ...req.body });
    res.status(201).json(publication);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.post('/api/projects/:projectId/publish', (req, res) => {
  try {
    const result = publishProject(req.params.projectId, req.body || {});
    if (!result) return res.status(404).json({ message: 'Project not found' });
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.post('/api/projects/:projectId/leads', (req, res) => {
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const phone = typeof req.body?.phone === 'string' ? req.body.phone.trim() : null;
  const { unitId = null } = req.body || {};

  if (name.length < 2 || name.length > 120) {
    return res.status(400).json({ message: 'name must be between 2 and 120 characters' });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return res.status(400).json({ message: 'valid email is required' });
  }

  if (phone !== null && (phone.length > 40 || phone.length === 0)) {
    return res.status(400).json({ message: 'phone must be a non-empty value up to 40 characters' });
  }

  if (unitId !== null && typeof unitId !== 'string') {
    return res.status(400).json({ message: 'unitId must be a string or null' });
  }

  try {
    const lead = createLead({
      name,
      email,
      phone,
      projectId: req.params.projectId,
      unitId,
    });
    return res.status(201).json(lead);
  } catch (error) {
    const status = /not found/i.test(error.message) ? 404 : 400;
    return res.status(status).json({ message: error.message });
  }
});

app.get('/api/projects/public/:slug', (req, res) => {
  try {
    const result = getPublishedProjectByPublicSlug(req.params.slug);
    if (!result) {
      return res.status(404).json({ message: 'Project not found or not published' });
    }
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.post('/api/auth/tenant-access', (req, res) => {
  const { requestedCompanyId, targetCompanyId } = req.body;
  res.json({ allowed: ensureCompanyAccess(requestedCompanyId, targetCompanyId) });
});

app.listen(port, () => {
  console.log(`Real Estate Platform API listening on http://localhost:${port}`);
});
