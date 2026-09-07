const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}/api${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });

  const text = await response.text();
  let payload = null;
  try { payload = text ? JSON.parse(text) : null; } catch { payload = text; }
  if (!response.ok) {
    const message = payload?.message || `Request failed (${response.status})`;
    throw new Error(message);
  }
  return payload;
}

export const platformApi = {
  getPlans: () => request('/platform/plans'),
  getProjectBySlug: (slug) => request(`/projects/slug/${encodeURIComponent(slug)}`),
  getProjectUnits: (projectId) => request(`/projects/${projectId}/units`),
  getCompanyProjectUnits: (companyId, projectId) => request(`/company/${companyId}/projects/${projectId}/units`),
  updateProjectUnit: (projectId, unitId, updates) => request(`/admin/projects/${projectId}/units/${unitId}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  }),
  updateCompanyProjectUnit: (companyId, projectId, unitId, updates) => request(`/company/${companyId}/projects/${projectId}/units/${unitId}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  }),
  getProjectState: (projectId) => request(`/admin/projects/${projectId}/platform-state`),
  getProjectAnalytics: (projectId, since) => request(`/admin/projects/${projectId}/analytics${since ? `?since=${encodeURIComponent(since)}` : ''}`),
  getProjectVersions: (projectId) => request(`/admin/projects/${projectId}/versions`),
  createProjectVersion: (projectId, snapshot, createdBy) => request(`/admin/projects/${projectId}/versions`, {
    method: 'POST',
    body: JSON.stringify({ snapshot, createdBy }),
  }),
  transitionProject: (projectId, status, versionId, actor) => request(`/admin/projects/${projectId}/lifecycle`, {
    method: 'POST',
    body: JSON.stringify({ status, versionId, actor }),
  }),
  getPublicManifest: (publicSlug) => request(`/public/projects/${encodeURIComponent(publicSlug)}/manifest`),
  recordAnalyticsEvent: (event) => request('/analytics/events', {
    method: 'POST',
    body: JSON.stringify(event),
  }),
  getSubscription: (companyId, projectId) => request(`/company/${companyId}/subscription${projectId ? `?projectId=${encodeURIComponent(projectId)}` : ''}`),
  createServiceRequest: (companyId, payload) => request(`/company/${companyId}/service-requests`, {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
};

export { API_BASE };
