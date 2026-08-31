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

const app = express();
const db = getDb();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: '5mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'real-estate-platform', timestamp: new Date().toISOString() });
});

app.get('/api/companies', (_req, res) => {
  res.json(listCompanies());
});

app.post('/api/companies', (req, res) => {
  const { name, slug } = req.body;
  if (!name || !slug) {
    return res.status(400).json({ message: 'name and slug are required' });
  }

  const company = createCompany({ name, slug });
  return res.status(201).json(company);
});

app.get('/api/companies/:companyId/projects', (req, res) => {
  res.json(listProjectsByCompany(req.params.companyId));
});

app.post('/api/projects', (req, res) => {
  const payload = req.body;
  if (!payload.companyId || !payload.name || !payload.slug) {
    return res.status(400).json({ message: 'companyId, name and slug are required' });
  }

  const project = createProject(payload);
  return res.status(201).json(project);
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
  const building = createBuilding({ projectId: req.params.projectId, name, reference, metadata });
  res.status(201).json(building);
});

app.get('/api/projects/:projectId/buildings', (req, res) => {
  res.json(listProjectBuildings(req.params.projectId));
});

app.post('/api/projects/:projectId/floors', (req, res) => {
  const { buildingId, number, name, metadata } = req.body;
  if (!buildingId || Number.isNaN(Number(number))) {
    return res.status(400).json({ message: 'buildingId and valid number are required' });
  }
  const floor = createFloor({ projectId: req.params.projectId, buildingId, number: Number(number), name, metadata });
  res.status(201).json(floor);
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

  const unit = createUnit({ projectId: req.params.projectId, ...payload });
  return res.status(201).json(unit);
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
  const unit = updateUnit(req.params.unitId, req.body);
  if (!unit) return res.status(404).json({ message: 'Unit not found' });
  res.json(unit);
});

app.post('/api/projects/:projectId/plans', (req, res) => {
  const plan = createPlan({ projectId: req.params.projectId, ...req.body });
  res.status(201).json(plan);
});

app.get('/api/projects/:projectId/plans', (req, res) => {
  res.json(db.prepare('SELECT * FROM plans WHERE projectId = ? ORDER BY createdAt ASC').all(req.params.projectId));
});

app.post('/api/projects/:projectId/amenities', (req, res) => {
  const amenity = createAmenity({ projectId: req.params.projectId, ...req.body });
  res.status(201).json(amenity);
});

app.get('/api/projects/:projectId/amenities', (req, res) => {
  res.json(listProjectAmenities(req.params.projectId));
});

app.post('/api/projects/:projectId/assets', (req, res) => {
  const asset = createAsset({ projectId: req.params.projectId, ...req.body });
  res.status(201).json(asset);
});

app.get('/api/projects/:projectId/assets', (req, res) => {
  res.json(listProjectAssets(req.params.projectId));
});

app.post('/api/projects/:projectId/location', (req, res) => {
  const location = createLocation({ projectId: req.params.projectId, ...req.body });
  res.status(201).json(location);
});

app.get('/api/projects/:projectId/location', (req, res) => {
  res.json(getProjectLocation(req.params.projectId));
});

app.post('/api/projects/:projectId/publication', (req, res) => {
  const publication = createProjectPublication({ projectId: req.params.projectId, ...req.body });
  res.status(201).json(publication);
});

app.post('/api/projects/:projectId/publish', (req, res) => {
  const result = publishProject(req.params.projectId, req.body || {});
  if (!result) return res.status(404).json({ message: 'Project not found' });
  res.json(result);
});

app.get('/api/projects/public/:slug', (req, res) => {
  const project = getProjectBySlug(req.params.slug);
  if (!project) return res.status(404).json({ message: 'Project not found' });

  const publication = db.prepare('SELECT * FROM project_publications WHERE projectId = ?').get(project.id);
  if (!publication || publication.isPublished !== 1) {
    return res.status(404).json({ message: 'Project is not publicly available' });
  }

  res.json({ project, publication });
});

app.post('/api/auth/tenant-access', (req, res) => {
  const { requestedCompanyId, targetCompanyId } = req.body;
  res.json({ allowed: ensureCompanyAccess(requestedCompanyId, targetCompanyId) });
});

app.listen(port, () => {
  console.log(`Real Estate Platform API listening on http://localhost:${port}`);
});
