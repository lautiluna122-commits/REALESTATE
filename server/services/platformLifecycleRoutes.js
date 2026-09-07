import express from 'express';
import { getDb } from '../db.js';
import {
  getProjectById,
  getPublishedProjectByPublicSlug,
  listProjectBuildings,
  listProjectFloors,
  listProjectUnits,
  getUnitById,
  updateUnit,
  listProjectAmenities,
  listProjectAssets,
  getProjectLocation,
  publishProject,
} from './projectService.js';
import {
  PLAN_CATALOG,
  transitionProject,
  recordAnalyticsEvent,
  getProjectAnalytics,
  createProjectVersion,
  listProjectVersions,
  createSubscription,
  getCompanySubscription,
  createServiceRequest,
  listServiceRequests,
} from './platformLifecycleService.js';

const router = express.Router();
const db = getDb();
const PUBLIC_EVENTS = new Set([
  'showroom_open', 'exterior_view', 'building_view', 'floor_select', 'unit_select',
  'plan_view', 'interior_open', 'room_select', 'panorama_open', 'cta_contact', 'cta_whatsapp',
]);

const projectCompanyId = (projectId) => getProjectById(projectId)?.companyId ?? null;
const sameCompany = (projectId, companyId) => Boolean(projectCompanyId(projectId) && projectCompanyId(projectId) === companyId);

function toPublicProject(project) {
  return {
    id: project.id,
    name: project.name,
    slug: project.slug,
    description: project.description,
    status: project.status,
    location: project.location,
    branding: project.branding,
    buildingReference: project.buildingReference,
    environmentConfig: project.environmentConfig,
  };
}

router.get('/platform/plans', (_req, res) => res.json(PLAN_CATALOG));

router.post('/analytics/events', (req, res) => {
  const { projectId, event, sessionId, entityType, entityId, metadata, occurredAt } = req.body ?? {};
  if (!projectId || !event) return res.status(400).json({ message: 'projectId and event are required' });
  if (!PUBLIC_EVENTS.has(event)) return res.status(400).json({ message: 'Unsupported analytics event' });
  const project = getProjectById(projectId);
  if (!project) return res.status(404).json({ message: 'Project not found' });
  if (project.status !== 'PUBLISHED') return res.status(409).json({ message: 'Analytics are available only for published projects' });
  try {
    res.status(201).json(recordAnalyticsEvent({ projectId, event, sessionId, entityType, entityId, metadata, occurredAt }));
  } catch (error) { res.status(400).json({ message: error.message }); }
});

router.get('/admin/projects/:projectId/analytics', (req, res) => {
  if (!getProjectById(req.params.projectId)) return res.status(404).json({ message: 'Project not found' });
  res.json(getProjectAnalytics(req.params.projectId, req.query.since || null));
});

router.post('/admin/projects/:projectId/versions', (req, res) => {
  if (!getProjectById(req.params.projectId)) return res.status(404).json({ message: 'Project not found' });
  try {
    const snapshot = req.body?.snapshot ?? req.body;
    res.status(201).json(createProjectVersion(req.params.projectId, snapshot, req.body?.createdBy ?? null));
  } catch (error) { res.status(400).json({ message: error.message }); }
});

router.get('/admin/projects/:projectId/versions', (req, res) => {
  if (!getProjectById(req.params.projectId)) return res.status(404).json({ message: 'Project not found' });
  res.json(listProjectVersions(req.params.projectId));
});

router.post('/admin/projects/:projectId/lifecycle', (req, res) => {
  const { status, versionId, actor } = req.body ?? {};
  if (!status) return res.status(400).json({ message: 'status is required' });
  try {
    const project = transitionProject(req.params.projectId, status, { versionId, actor });
    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.json(project);
  } catch (error) { res.status(400).json({ message: error.message }); }
});

router.post('/admin/projects/:projectId/publish', (req, res) => {
  const project = getProjectById(req.params.projectId);
  if (!project) return res.status(404).json({ message: 'Project not found' });
  if (project.status !== 'APPROVED') return res.status(409).json({ message: `Project must be APPROVED before publication (current: ${project.status})` });
  const versions = listProjectVersions(project.id);
  const version = versions[0];
  if (!version || version.status !== 'APPROVED') return res.status(409).json({ message: 'An approved project version is required before publication' });
  try {
    transitionProject(project.id, 'PUBLISHED', { versionId: version.id, actor: req.body?.actor ?? null });
    const result = publishProject(project.id, req.body || {});
    res.json(result);
  } catch (error) { res.status(400).json({ message: error.message }); }
});

router.get('/admin/projects/:projectId/platform-state', (req, res) => {
  const project = getProjectById(req.params.projectId);
  if (!project) return res.status(404).json({ message: 'Project not found' });
  const versions = listProjectVersions(req.params.projectId);
  const analytics = getProjectAnalytics(req.params.projectId);
  const subscription = getCompanySubscription(project.companyId, req.params.projectId);
  const publication = db.prepare('SELECT * FROM project_publications WHERE projectId = ? ORDER BY createdAt DESC LIMIT 1').get(req.params.projectId) ?? null;
  res.json({ project, versions, analytics, subscription, publication });
});

router.get('/public/projects/:publicSlug/manifest', (req, res) => {
  try {
    const result = getPublishedProjectByPublicSlug(req.params.publicSlug);
    if (!result) return res.status(404).json({ message: 'Project not found or not published' });
    const { project, publication } = result;
    res.json({
      contractVersion: '1.0',
      project: toPublicProject(project),
      publication: {
        publicSlug: publication.publicSlug,
        publicUrl: publication.publicUrl,
        title: publication.title,
        description: publication.description,
        thumbnail: publication.thumbnail,
        buttonText: publication.buttonText,
        customDomain: publication.customDomain,
        status: publication.status,
        isPublished: true,
      },
      buildings: listProjectBuildings(project.id).map(({ id, projectId, name, reference, metadata, createdAt }) => ({ id, projectId, name, reference, metadata, createdAt })),
      floors: listProjectFloors(project.id).map(({ id, projectId, buildingId, number, name, metadata, createdAt }) => ({ id, projectId, buildingId, number, name, metadata, createdAt })),
      units: listProjectUnits(project.id),
      plans: db.prepare('SELECT id, projectId, name, kind, filePath, description, createdAt FROM plans WHERE projectId = ? ORDER BY createdAt ASC').all(project.id),
      amenities: listProjectAmenities(project.id),
      assets: listProjectAssets(project.id),
      location: getProjectLocation(project.id),
    });
  } catch (error) { res.status(400).json({ message: error.message }); }
});

router.patch('/company/:companyId/projects/:projectId/units/:unitId', (req, res) => {
  const { companyId, projectId, unitId } = req.params;
  if (!sameCompany(projectId, companyId)) return res.status(403).json({ message: 'Project does not belong to company' });
  try {
    const unit = updateUnit(projectId, unitId, req.body ?? {});
    if (!unit) return res.status(404).json({ message: 'Unit not found' });
    res.json(unit);
  } catch (error) { res.status(400).json({ message: error.message }); }
});

router.get('/company/:companyId/projects/:projectId/units', (req, res) => {
  const { companyId, projectId } = req.params;
  if (!sameCompany(projectId, companyId)) return res.status(403).json({ message: 'Project does not belong to company' });
  res.json(listProjectUnits(projectId));
});

router.get('/company/:companyId/projects/:projectId/units/:unitId', (req, res) => {
  const { companyId, projectId, unitId } = req.params;
  if (!sameCompany(projectId, companyId)) return res.status(403).json({ message: 'Project does not belong to company' });
  const unit = getUnitById(projectId, unitId);
  if (!unit) return res.status(404).json({ message: 'Unit not found' });
  res.json(unit);
});

router.post('/admin/subscriptions', (req, res) => {
  const { companyId, planCode } = req.body ?? {};
  if (!companyId || !planCode || !PLAN_CATALOG[planCode]) return res.status(400).json({ message: 'companyId and valid planCode are required' });
  try { res.status(201).json(createSubscription(req.body)); }
  catch (error) { res.status(400).json({ message: error.message }); }
});

router.get('/company/:companyId/subscription', (req, res) => {
  res.json(getCompanySubscription(req.params.companyId, req.query.projectId || null));
});

router.post('/company/:companyId/service-requests', (req, res) => {
  const { projectId } = req.body ?? {};
  if (projectId && !sameCompany(projectId, req.params.companyId)) return res.status(403).json({ message: 'Project does not belong to company' });
  try { res.status(201).json(createServiceRequest({ ...req.body, companyId: req.params.companyId })); }
  catch (error) { res.status(400).json({ message: error.message }); }
});

router.get('/company/:companyId/service-requests', (req, res) => {
  res.json(listServiceRequests(req.params.companyId, req.query.projectId || null));
});

export default router;
