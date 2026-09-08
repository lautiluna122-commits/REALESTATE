import express from 'express';
import cors from 'cors';
import { getDb } from './db.js';
import {
  listCompanies,
  createCompany,
  listProjectsByCompany,
  createProject,
  getProjectById,
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
  ensureCompanyAccess,
} from './services/projectService.js';
import platformLifecycleRoutes from './services/platformLifecycleRoutes.js';
import { requireAuth, requireSuperAdmin, requireCompanyAccess } from './services/authMiddleware.js';

const app = express();
const db = getDb();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: '5mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'real-estate-platform', timestamp: new Date().toISOString() });
});

app.use('/api', platformLifecycleRoutes);
app.use('/api/admin', requireSuperAdmin);

app.get('/api/admin/companies', (_req, res) => res.json(listCompanies()));
app.post('/api/admin/companies', (req, res) => {
  const { name, slug } = req.body ?? {};
  if (!name || !slug) return res.status(400).json({ message: 'name and slug are required' });
  try { return res.status(201).json(createCompany({ name, slug })); }
  catch (error) { return res.status(400).json({ message: error.message }); }
});
app.get('/api/admin/companies/:companyId/projects', (req, res) => res.json(listProjectsByCompany(req.params.companyId)));
app.post('/api/admin/projects', (req, res) => {
  const payload = req.body ?? {};
  if (!payload.companyId || !payload.name || !payload.slug) return res.status(400).json({ message: 'companyId, name and slug are required' });
  try { return res.status(201).json(createProject(payload)); }
  catch (error) { return res.status(400).json({ message: error.message }); }
});
app.get('/api/admin/projects/:projectId', (req, res) => {
  const project = getProjectById(req.params.projectId);
  if (!project) return res.status(404).json({ message: 'Project not found' });
  res.json(project);
});
app.post('/api/admin/projects/:projectId/buildings', (req, res) => {
  try { return res.status(201).json(createBuilding({ projectId: req.params.projectId, ...req.body })); }
  catch (error) { return res.status(400).json({ message: error.message }); }
});
app.get('/api/admin/projects/:projectId/buildings', (req, res) => res.json(listProjectBuildings(req.params.projectId)));
app.post('/api/admin/projects/:projectId/floors', (req, res) => {
  const { buildingId, number, name, metadata } = req.body ?? {};
  if (!buildingId || Number.isNaN(Number(number))) return res.status(400).json({ message: 'buildingId and valid number are required' });
  try { return res.status(201).json(createFloor({ projectId: req.params.projectId, buildingId, number: Number(number), name, metadata })); }
  catch (error) { return res.status(400).json({ message: error.message }); }
});
app.get('/api/admin/projects/:projectId/floors', (req, res) => res.json(listProjectFloors(req.params.projectId, req.query.buildingId || null)));
app.post('/api/admin/projects/:projectId/units', (req, res) => {
  try { return res.status(201).json(createUnit({ projectId: req.params.projectId, ...(req.body ?? {}) })); }
  catch (error) { return res.status(400).json({ message: error.message }); }
});
app.get('/api/admin/projects/:projectId/units', (req, res) => res.json(listProjectUnits(req.params.projectId)));
app.get('/api/admin/projects/:projectId/units/:unitId', (req, res) => {
  const unit = getUnitById(req.params.projectId, req.params.unitId);
  if (!unit) return res.status(404).json({ message: 'Unit not found' });
  res.json(unit);
});
app.patch('/api/admin/projects/:projectId/units/:unitId', (req, res) => {
  try {
    const unit = updateUnit(req.params.projectId, req.params.unitId, req.body ?? {});
    if (!unit) return res.status(404).json({ message: 'Unit not found' });
    res.json(unit);
  } catch (error) { res.status(400).json({ message: error.message }); }
});
app.post('/api/admin/projects/:projectId/plans', (req, res) => {
  try { res.status(201).json(createPlan({ projectId: req.params.projectId, ...(req.body ?? {}) })); }
  catch (error) { res.status(400).json({ message: error.message }); }
});
app.get('/api/admin/projects/:projectId/plans', (req, res) => res.json(db.prepare('SELECT * FROM plans WHERE projectId = ? ORDER BY createdAt ASC').all(req.params.projectId)));
app.post('/api/admin/projects/:projectId/amenities', (req, res) => {
  try { res.status(201).json(createAmenity({ projectId: req.params.projectId, ...(req.body ?? {}) })); }
  catch (error) { res.status(400).json({ message: error.message }); }
});
app.get('/api/admin/projects/:projectId/amenities', (req, res) => res.json(listProjectAmenities(req.params.projectId)));
app.post('/api/admin/projects/:projectId/assets', (req, res) => {
  try { res.status(201).json(createAsset({ projectId: req.params.projectId, ...(req.body ?? {}) })); }
  catch (error) { res.status(400).json({ message: error.message }); }
});
app.get('/api/admin/projects/:projectId/assets', (req, res) => res.json(listProjectAssets(req.params.projectId)));
app.post('/api/admin/projects/:projectId/location', (req, res) => {
  try { res.status(201).json(createLocation({ projectId: req.params.projectId, ...(req.body ?? {}) })); }
  catch (error) { res.status(400).json({ message: error.message }); }
});
app.get('/api/admin/projects/:projectId/location', (req, res) => res.json(getProjectLocation(req.params.projectId)));
app.post('/api/admin/projects/:projectId/publication', (req, res) => {
  try { res.status(201).json(createProjectPublication({ projectId: req.params.projectId, ...(req.body ?? {}) })); }
  catch (error) { res.status(400).json({ message: error.message }); }
});
app.post('/api/admin/projects/:projectId/publish-direct', (req, res) => {
  try {
    const result = publishProject(req.params.projectId, req.body ?? {});
    if (!result) return res.status(404).json({ message: 'Project not found' });
    res.json(result);
  } catch (error) { res.status(400).json({ message: error.message }); }
});

app.use('/api/company', requireCompanyAccess());
app.get('/api/company/:companyId/projects', (req, res) => res.json(listProjectsByCompany(req.params.companyId)));
app.get('/api/company/:companyId/projects/:projectId', (req, res) => {
  const project = getProjectById(req.params.projectId);
  if (!project) return res.status(404).json({ message: 'Project not found' });
  if (project.companyId !== req.params.companyId) return res.status(403).json({ message: 'Access denied' });
  res.json(project);
});

app.get('/api/public/projects', (_req, res) => res.json(listPublicProjects()));
app.get('/api/public/projects/:publicSlug', (req, res) => {
  try {
    const result = getPublishedProjectByPublicSlug(req.params.publicSlug);
    if (!result) return res.status(404).json({ message: 'Project not found or not published' });
    res.json(result);
  } catch (error) { res.status(400).json({ message: error.message }); }
});

app.post('/api/auth/tenant-access', requireAuth, (req, res) => {
  const targetCompanyId = req.body?.targetCompanyId;
  const allowed = req.auth.role === 'SUPER_ADMIN'
    ? Boolean(targetCompanyId)
    : ensureCompanyAccess(req.auth.companyId, targetCompanyId);
  res.json({ allowed });
});

app.listen(port, () => console.log(`Real Estate Platform API listening on http://localhost:${port}`));
