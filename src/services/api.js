// Base API configuration
const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || `Request failed: ${response.status}`);
  }
  return response.json();
}

export const companiesAPI = {
  listAll: () => request('/admin/companies'),
  create: (data) => request('/admin/companies', { method: 'POST', body: JSON.stringify(data) }),
  getById: (companyId) => request(`/admin/companies/${companyId}`),
  listProjects: (companyId) => request(`/admin/companies/${companyId}/projects`),
};

export const projectsAPI = {
  create: (data) => request('/admin/projects', { method: 'POST', body: JSON.stringify(data) }),
  getById: (projectId) => request(`/admin/projects/${projectId}`),
  listByCompany: (companyId) => request(`/admin/companies/${companyId}/projects`),
  listPublic: () => request('/public/projects'),
  getPublishedBySlug: (publicSlug) => request(`/public/projects/${publicSlug}`),
};

export const buildingsAPI = {
  create: (projectId, data) => request(`/admin/projects/${projectId}/buildings`, { method: 'POST', body: JSON.stringify(data) }),
  listByProject: (projectId) => request(`/admin/projects/${projectId}/buildings`),
};

export const floorsAPI = {
  create: (projectId, data) => request(`/admin/projects/${projectId}/floors`, { method: 'POST', body: JSON.stringify(data) }),
  listByProject: (projectId, buildingId) => request(`/admin/projects/${projectId}/floors${buildingId ? `?buildingId=${encodeURIComponent(buildingId)}` : ''}`),
};

export const unitsAPI = {
  create: (projectId, data) => request(`/admin/projects/${projectId}/units`, { method: 'POST', body: JSON.stringify(data) }),
  listByProject: (projectId) => request(`/admin/projects/${projectId}/units`),
  getById: (projectId, unitId) => request(`/admin/projects/${projectId}/units/${unitId}`),
  update: (projectId, unitId, data) => request(`/admin/projects/${projectId}/units/${unitId}`, { method: 'PATCH', body: JSON.stringify(data) }),
};

export const plansAPI = {
  create: (projectId, data) => request(`/admin/projects/${projectId}/plans`, { method: 'POST', body: JSON.stringify(data) }),
  listByProject: (projectId) => request(`/admin/projects/${projectId}/plans`),
};

export const amenitiesAPI = {
  create: (projectId, data) => request(`/admin/projects/${projectId}/amenities`, { method: 'POST', body: JSON.stringify(data) }),
  listByProject: (projectId) => request(`/admin/projects/${projectId}/amenities`),
};

export const assetsAPI = {
  create: (projectId, data) => request(`/admin/projects/${projectId}/assets`, { method: 'POST', body: JSON.stringify(data) }),
  listByProject: (projectId) => request(`/admin/projects/${projectId}/assets`),
};

export const locationAPI = {
  create: (projectId, data) => request(`/admin/projects/${projectId}/location`, { method: 'POST', body: JSON.stringify(data) }),
  getByProject: (projectId) => request(`/admin/projects/${projectId}/location`),
};

export const publicationAPI = {
  create: (projectId, data) => request(`/admin/projects/${projectId}/publication`, { method: 'POST', body: JSON.stringify(data) }),
  get: (projectId) => request(`/admin/projects/${projectId}/publication`),
  update: (projectId, data) => request(`/admin/projects/${projectId}/publication`, { method: 'PATCH', body: JSON.stringify(data) }),
  publish: (projectId, data) => request(`/admin/projects/${projectId}/publish`, { method: 'POST', body: JSON.stringify(data) }),
  unpublish: (projectId) => request(`/admin/projects/${projectId}/unpublish`, { method: 'POST' }),
};

export const leadsAPI = {
  list: (projectId) => request(`/admin/projects/${projectId}/leads`),
};

export const aiAPI = {
  listJobs: (projectId) => request(`/admin/projects/${projectId}/ai/jobs`),
  createJob: (projectId, data) => request(`/admin/projects/${projectId}/ai/jobs`, { method: 'POST', body: JSON.stringify(data) }),
  getJob: (projectId, jobId) => request(`/admin/projects/${projectId}/ai/jobs/${jobId}`),
  approveJob: (projectId, jobId, data = {}) => request(`/admin/projects/${projectId}/ai/jobs/${jobId}/approve`, { method: 'POST', body: JSON.stringify(data) }),
};

export const experienceAPI = {
  get: (projectId) => request(`/admin/projects/${projectId}/experience`),
  save: (projectId, data) => request(`/admin/projects/${projectId}/experience`, { method: 'PUT', body: JSON.stringify(data) }),
};

export const analyticsAPI = {
  listEvents: (projectId) => request(`/admin/projects/${projectId}/events`),
};
