import express from 'express';
import { getDb } from '../db.js';
import { getProjectById } from './projectService.js';
import {
  PLAN_CATALOG,
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

const projectCompanyId = (projectId) => getProjectById(projectId)?.companyId ?? null;
const sameCompany = (projectId, companyId) => Boolean(projectCompanyId(projectId) && projectCompanyId(projectId) === companyId);

router.get('/platform/plans', (_req, res) => res.json(PLAN_CATALOG));

router.post('/analytics/events', (req, res) => {
  const { projectId, event, sessionId, entityType, entityId, metadata, occurredAt } = req.body ?? {};
  if (!projectId || !event) return res.status(400).json({ message: 'projectId and event are required' });
  if (!projectCompanyId(projectId)) return res.status(404).json({ message: 'Project not found' });
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

router.get('/admin/projects/:projectId/platform-state', (req, res) => {
  const project = getProjectById(req.params.projectId);
  if (!project) return res.status(404).json({ message: 'Project not found' });
  const versions = listProjectVersions(req.params.projectId);
  const analytics = getProjectAnalytics(req.params.projectId);
  const subscription = getCompanySubscription(project.companyId, req.params.projectId);
  const publication = db.prepare('SELECT * FROM project_publications WHERE projectId = ? ORDER BY createdAt DESC LIMIT 1').get(req.params.projectId) ?? null;
  res.json({ project, versions, analytics, subscription, publication });
});

export default router;
