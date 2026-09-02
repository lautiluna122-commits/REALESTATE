// Base API configuration
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:4000';

// Helper para hacer requests
async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || `Request failed: ${response.status}`);
  }

  return response.json();
}

// ============================================================
// COMPANIES
// ============================================================

export const companiesAPI = {
  listAll: () => request('/api/admin/companies'),
  create: (data) => request('/api/admin/companies', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getById: (companyId) => request(`/api/admin/companies/${companyId}`),
  listProjects: (companyId) => request(`/api/admin/companies/${companyId}/projects`),
};

// ============================================================
// PROJECTS
// ============================================================

export const projectsAPI = {
  create: (data) => request('/api/admin/projects', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getById: (projectId) => request(`/api/admin/projects/${projectId}`),
  listByCompany: (companyId) => request(`/api/admin/companies/${companyId}/projects`),
  listPublic: () => request('/api/public/projects'),
  getPublishedBySlug: (publicSlug) => request(`/api/public/projects/${publicSlug}`),
};

// ============================================================
// BUILDINGS
// ============================================================

export const buildingsAPI = {
  create: (projectId, data) => request(`/api/admin/projects/${projectId}/buildings`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  listByProject: (projectId) => request(`/api/admin/projects/${projectId}/buildings`),
  getById: (projectId, buildingId) => request(`/api/admin/projects/${projectId}/buildings/${buildingId}`),
};

// ============================================================
// FLOORS
// ============================================================

export const floorsAPI = {
  create: (projectId, data) => request(`/api/admin/projects/${projectId}/floors`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  listByProject: (projectId) => request(`/api/admin/projects/${projectId}/floors`),
  listByBuilding: (projectId, buildingId) => request(
    `/api/admin/projects/${projectId}/floors?buildingId=${buildingId}`,
  ),
  getById: (projectId, floorId) => request(`/api/admin/projects/${projectId}/floors/${floorId}`),
};

// ============================================================
// UNITS
// ============================================================

export const unitsAPI = {
  create: (projectId, data) => request(`/api/admin/projects/${projectId}/units`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  listByProject: (projectId) => request(`/api/admin/projects/${projectId}/units`),
  getById: (projectId, unitId) => request(`/api/admin/projects/${projectId}/units/${unitId}`),
  update: (projectId, unitId, data) => request(
    `/api/admin/projects/${projectId}/units/${unitId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(data),
    },
  ),
};

// ============================================================
// PLANS
// ============================================================

export const plansAPI = {
  create: (projectId, data) => request(`/api/admin/projects/${projectId}/plans`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  listByProject: (projectId) => request(`/api/admin/projects/${projectId}/plans`),
};

// ============================================================
// AMENITIES
// ============================================================

export const amenitiesAPI = {
  create: (projectId, data) => request(`/api/admin/projects/${projectId}/amenities`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  listByProject: (projectId) => request(`/api/admin/projects/${projectId}/amenities`),
};

// ============================================================
// ASSETS
// ============================================================

export const assetsAPI = {
  create: (projectId, data) => request(`/api/admin/projects/${projectId}/assets`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  listByProject: (projectId) => request(`/api/admin/projects/${projectId}/assets`),
};

// ============================================================
// LOCATION
// ============================================================

export const locationAPI = {
  create: (projectId, data) => request(`/api/admin/projects/${projectId}/location`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getByProject: (projectId) => request(`/api/admin/projects/${projectId}/location`),
};

// ============================================================
// PUBLICATION
// ============================================================

export const publicationAPI = {
  create: (projectId, data) => request(`/api/admin/projects/${projectId}/publication`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  publish: (projectId, data) => request(`/api/admin/projects/${projectId}/publish`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};
