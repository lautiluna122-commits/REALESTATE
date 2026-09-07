export const INGESTION_STAGE = Object.freeze({
  UPLOAD: 'upload', CLASSIFY: 'classify', EXTRACT: 'extract', NORMALIZE: 'normalize', VALIDATE: 'validate', APPROVE: 'approve', GENERATE: 'generate',
});

export const INGESTION_KIND = Object.freeze({
  PLAN: 'plan', INVENTORY: 'inventory', BIM: 'bim', BUILDING_MODEL: 'buildingModel', UNIT_MODEL: 'unitModel', INTERIOR: 'interiorRender', PANORAMA: 'panorama360', BRANDING: 'branding', COMMERCIAL: 'commercial', UNKNOWN: 'unknown',
});

export function createIngestionJob({ projectId, sourceName, sourceType, sourceRef = null }) {
  return { id: cryptoId(), projectId, sourceName, sourceType, sourceRef, stage: INGESTION_STAGE.UPLOAD, status: 'QUEUED', proposals: [], validation: { errors: [], warnings: [] }, createdAt: new Date().toISOString() };
}

export function createProposal(job, type, data, confidence = 0) {
  return { id: cryptoId(), jobId: job.id, type, data, confidence, requiresApproval: true, status: 'PROPOSED' };
}

export function approveProposal(proposal, approvedBy) {
  return { ...proposal, status: 'APPROVED', approvedBy, approvedAt: new Date().toISOString() };
}

function cryptoId() { return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`; }
