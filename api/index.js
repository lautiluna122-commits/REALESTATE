import express from 'express';
import cors from 'cors';
import { handleUpload } from '@vercel/blob/client';
import {
  listCompanies, createCompany, listProjectsByCompany, createProject, getProjectById, getPublishedProjectByPublicSlug, listPublicProjects,
  createBuilding, listProjectBuildings, createFloor, listProjectFloors, createUnit, listProjectUnits, getUnitById, updateUnit,
  createPlan, createAmenity, listProjectAmenities, createAsset, updateAsset, listProjectAssets, createLocation, getProjectLocation,
  createProjectPublication, publishProject, ensureCompanyAccess,
} from '../server/services/projectService.js';
import { getDb } from '../server/db.js';
import platformLifecycleRoutes from '../server/services/platformLifecycleRoutes.js';
import { getUnrealProjectManifest, getUnrealProjectStatus } from '../server/services/enginePipelineService.js';
import { requireAuth, requireSuperAdmin, requireCompanyAccess } from '../server/services/authMiddleware.js';
import { createAssetPath, maxServerUploadBytes, putPublicObject, storageConfigured } from '../server/services/objectStorageService.js';

const app = express();
const db = getDb();
app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'real-estate-platform', timestamp: new Date().toISOString(), storage: storageConfigured() ? 'configured' : 'not-configured' }));
app.use('/api', platformLifecycleRoutes);
app.use('/api/admin', requireSuperAdmin);

app.get('/api/admin/companies', (_req, res) => res.json(listCompanies()));
app.post('/api/admin/companies', (req, res) => { const { name, slug } = req.body ?? {}; if (!name || !slug) return res.status(400).json({ message: 'name and slug are required' }); try { return res.status(201).json(createCompany({ name, slug })); } catch (error) { return res.status(400).json({ message: error.message }); } });
app.get('/api/admin/companies/:companyId/projects', (req, res) => res.json(listProjectsByCompany(req.params.companyId)));
app.post('/api/admin/projects', (req, res) => { const payload = req.body ?? {}; if (!payload.companyId || !payload.name || !payload.slug) return res.status(400).json({ message: 'companyId, name and slug are required' }); try { return res.status(201).json(createProject(payload)); } catch (error) { return res.status(400).json({ message: error.message }); } });
app.get('/api/admin/projects/:projectId', (req, res) => { const project = getProjectById(req.params.projectId); if (!project) return res.status(404).json({ message: 'Project not found' }); res.json(project); });
app.post('/api/admin/projects/:projectId/buildings', (req, res) => { try { return res.status(201).json(createBuilding({ projectId: req.params.projectId, ...req.body })); } catch (error) { return res.status(400).json({ message: error.message }); } });
app.get('/api/admin/projects/:projectId/buildings', (req, res) => res.json(listProjectBuildings(req.params.projectId)));
app.post('/api/admin/projects/:projectId/floors', (req, res) => { const { buildingId, number, name, metadata } = req.body ?? {}; if (!buildingId || Number.isNaN(Number(number))) return res.status(400).json({ message: 'buildingId and valid number are required' }); try { return res.status(201).json(createFloor({ projectId: req.params.projectId, buildingId, number: Number(number), name, metadata })); } catch (error) { return res.status(400).json({ message: error.message }); } });
app.get('/api/admin/projects/:projectId/floors', (req, res) => res.json(listProjectFloors(req.params.projectId, req.query.buildingId || null)));
app.post('/api/admin/projects/:projectId/units', (req, res) => { try { return res.status(201).json(createUnit({ projectId: req.params.projectId, ...(req.body ?? {}) })); } catch (error) { return res.status(400).json({ message: error.message }); } });
app.get('/api/admin/projects/:projectId/units', (req, res) => res.json(listProjectUnits(req.params.projectId)));
app.get('/api/admin/projects/:projectId/units/:unitId', (req, res) => { const unit = getUnitById(req.params.projectId, req.params.unitId); if (!unit) return res.status(404).json({ message: 'Unit not found' }); res.json(unit); });
app.patch('/api/admin/projects/:projectId/units/:unitId', (req, res) => { try { const unit = updateUnit(req.params.projectId, req.params.unitId, req.body ?? {}); if (!unit) return res.status(404).json({ message: 'Unit not found' }); res.json(unit); } catch (error) { res.status(400).json({ message: error.message }); } });
app.post('/api/admin/projects/:projectId/plans', (req, res) => { try { res.status(201).json(createPlan({ projectId: req.params.projectId, ...(req.body ?? {}) })); } catch (error) { res.status(400).json({ message: error.message }); } });
app.get('/api/admin/projects/:projectId/plans', (req, res) => res.json(db.prepare('SELECT * FROM plans WHERE projectId = ? ORDER BY createdAt ASC').all(req.params.projectId)));
app.post('/api/admin/projects/:projectId/amenities', (req, res) => { try { res.status(201).json(createAmenity({ projectId: req.params.projectId, ...(req.body ?? {}) })); } catch (error) { res.status(400).json({ message: error.message }); } });
app.get('/api/admin/projects/:projectId/amenities', (req, res) => res.json(listProjectAmenities(req.params.projectId)));
app.post('/api/admin/projects/:projectId/assets', (req, res) => { try { res.status(201).json(createAsset({ projectId: req.params.projectId, ...(req.body ?? {}) })); } catch (error) { res.status(400).json({ message: error.message }); } });
app.get('/api/admin/projects/:projectId/assets', (req, res) => res.json(listProjectAssets(req.params.projectId)));
app.post('/api/admin/projects/:projectId/assets/:assetId/upload', async (req, res) => {
  const { projectId, assetId } = req.params;
  const project = getProjectById(projectId);
  const asset = listProjectAssets(projectId).find((item) => item.id === assetId);
  if (!project) return res.status(404).json({ message: 'Project not found' });
  if (!asset) return res.status(404).json({ message: 'Asset not found' });
  try {
    const body = req.body ?? {};
    const request = new Request(`${req.protocol}://${req.get('host')}${req.originalUrl}`, { method: 'POST', headers: { 'content-type': 'application/json', authorization: req.get('authorization') || '' }, body: JSON.stringify(body) });
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        const prefix = `projects/${projectId}/assets/${assetId}/`;
        if (!pathname.startsWith(prefix) || pathname.includes('..')) throw new Error('Invalid asset pathname');
        const allowedContentTypes = asset.mimeType ? [asset.mimeType] : ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'application/pdf', 'model/gltf-binary', 'model/gltf+json', 'video/mp4', 'video/webm', 'video/quicktime', 'application/octet-stream'];
        return { allowedContentTypes, addRandomSuffix: false, tokenPayload: JSON.stringify({ projectId, assetId }) };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        const { projectId: completedProjectId, assetId: completedAssetId } = JSON.parse(tokenPayload || '{}');
        updateAsset(completedProjectId, completedAssetId, { path: blob.pathname, url: blob.url, mimeType: blob.contentType || asset.mimeType, metadata: { ...(asset.metadata || {}), storage: 'vercel-blob', size: blob.size ?? null, uploadedAt: new Date().toISOString() } });
      },
    });
    return res.status(200).json(result);
  } catch (error) { return res.status(400).json({ message: error.message }); }
});
app.get('/api/admin/projects/:projectId/engine/unreal/status', (req, res) => { const result = getUnrealProjectStatus(req.params.projectId); if (!result) return res.status(404).json({ message: 'Project not found' }); res.json(result); });
app.get('/api/admin/projects/:projectId/engine/unreal/manifest', (req, res) => { const result = getUnrealProjectManifest(req.params.projectId); if (!result) return res.status(404).json({ message: 'Project not found' }); res.json(result); });
app.post('/api/admin/projects/:projectId/location', (req, res) => { try { res.status(201).json(createLocation({ projectId: req.params.projectId, ...(req.body ?? {}) })); } catch (error) { res.status(400).json({ message: error.message }); } });
app.get('/api/admin/projects/:projectId/location', (req, res) => res.json(getProjectLocation(req.params.projectId)));
app.post('/api/admin/projects/:projectId/publication', (req, res) => { try { res.status(201).json(createProjectPublication({ projectId: req.params.projectId, ...(req.body ?? {}) })); } catch (error) { res.status(400).json({ message: error.message }); } });
app.post('/api/admin/projects/:projectId/publish-direct', (req, res) => { try { const result = publishProject(req.params.projectId, req.body ?? {}); if (!result) return res.status(404).json({ message: 'Project not found' }); res.json(result); } catch (error) { res.status(400).json({ message: error.message }); } });

app.use('/api/company', requireCompanyAccess());
app.get('/api/company/:companyId/projects', (req, res) => res.json(listProjectsByCompany(req.params.companyId)));
app.get('/api/company/:companyId/projects/:projectId', (req, res) => { const project = getProjectById(req.params.projectId); if (!project) return res.status(404).json({ message: 'Project not found' }); if (project.companyId !== req.params.companyId) return res.status(403).json({ message: 'Access denied' }); res.json(project); });
app.put('/api/company/:companyId/projects/:projectId/assets/:assetId/content', express.raw({ type: '*/*', limit: maxServerUploadBytes() }), async (req, res) => { const { companyId, projectId, assetId } = req.params; const project = getProjectById(projectId); if (!project) return res.status(404).json({ message: 'Project not found' }); if (project.companyId !== companyId) return res.status(403).json({ message: 'Project does not belong to company' }); const asset = listProjectAssets(projectId).find((item) => item.id === assetId); if (!asset) return res.status(404).json({ message: 'Asset not found' }); if (!storageConfigured()) return res.status(503).json({ message: 'Durable object storage is not configured' }); if (!Buffer.isBuffer(req.body) || req.body.length === 0) return res.status(400).json({ message: 'Binary asset body is required' }); try { const pathname = createAssetPath({ companyId, projectId, assetId, filename: asset.name }); const uploaded = await putPublicObject({ pathname, body: req.body, contentType: req.get('content-type') || asset.mimeType || 'application/octet-stream' }); updateAsset(projectId, assetId, { path: pathname, url: uploaded.url, mimeType: uploaded.contentType || asset.mimeType || null }); res.status(201).json({ assetId, path: pathname, url: uploaded.url, downloadUrl: uploaded.downloadUrl, contentType: uploaded.contentType || asset.mimeType || null, etag: uploaded.etag || null }); } catch (error) { res.status(502).json({ message: error.message }); } });
app.get('/api/public/projects', (_req, res) => res.json(listPublicProjects()));
app.get('/api/public/projects/:publicSlug', (req, res) => { try { const result = getPublishedProjectByPublicSlug(req.params.publicSlug); if (!result) return res.status(404).json({ message: 'Project not found or not published' }); res.json(result); } catch (error) { res.status(400).json({ message: error.message }); } });
app.post('/api/auth/tenant-access', requireAuth, (req, res) => { const targetCompanyId = req.body?.targetCompanyId; const allowed = req.auth.role === 'SUPER_ADMIN' ? Boolean(targetCompanyId) : ensureCompanyAccess(req.auth.companyId, targetCompanyId); res.json({ allowed }); });
export default app;
