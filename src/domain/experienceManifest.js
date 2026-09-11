export const PROJECT_STATUS = Object.freeze({
  DRAFT: 'DRAFT',
  PROCESSING: 'PROCESSING',
  REVIEW_REQUIRED: 'REVIEW_REQUIRED',
  READY: 'READY',
  PUBLISHED: 'PUBLISHED',
  UNPUBLISHED: 'UNPUBLISHED',
});

export const EXTRACTION_REVIEW = Object.freeze({
  PROPOSED: 'PROPOSED',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  REVIEW_REQUIRED: 'REVIEW_REQUIRED',
});

export function createExtractionField({
  key,
  value = null,
  sourceAssetId = null,
  confidence = 0,
  reviewState = EXTRACTION_REVIEW.PROPOSED,
  note = '',
}) {
  return { key, value, sourceAssetId, confidence, reviewState, note };
}

export function createExperienceManifest({
  schemaVersion = 1,
  projectId,
  publication = null,
  scene = {},
  buildings = [],
  floorPlans = [],
  unitAnchors = [],
  assets = [],
  cameraPresets = [],
  analytics = {},
}) {
  if (!projectId) throw new Error('projectId is required');
  return {
    schemaVersion,
    projectId,
    publication,
    scene,
    buildings,
    floorPlans,
    unitAnchors,
    assets,
    cameraPresets,
    analytics,
  };
}

export function canPublish(status, fields = []) {
  if (status !== PROJECT_STATUS.READY) return false;
  return fields.every((field) => field.reviewState === EXTRACTION_REVIEW.APPROVED);
}

export function normalizeExtractionValue(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return value;
  const normalized = String(value).trim().replace(/\s+/g, ' ');
  return normalized || null;
}
