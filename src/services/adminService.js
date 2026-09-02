// API base URL - configurable
const API_BASE = 'http://localhost:4000/api/admin';

export const apiCall = async (method, endpoint, body = null) => {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, options);
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
};

// ============================================================
// COMPANIES
// ============================================================

export const companyService = {
  listAll: () => apiCall('GET', '/companies'),
  create: (data) => apiCall('POST', '/companies', data),
  getProjects: (companyId) => apiCall('GET', `/companies/${companyId}/projects`),
};

// ============================================================
// PROJECTS
// ============================================================

export const projectService = {
  create: (data) => apiCall('POST', '/projects', data),
  getById: (projectId) => apiCall('GET', `/projects/${projectId}`),
  update: (projectId, data) => apiCall('PATCH', `/projects/${projectId}`, data),
};

// ============================================================
// BUILDINGS
// ============================================================

export const buildingService = {
  list: (projectId) => apiCall('GET', `/projects/${projectId}/buildings`),
  create: (projectId, data) => apiCall('POST', `/projects/${projectId}/buildings`, data),
  update: (projectId, buildingId, data) =>
    apiCall('PATCH', `/projects/${projectId}/buildings/${buildingId}`, data),
};

// ============================================================
// FLOORS
// ============================================================

export const floorService = {
  list: (projectId, buildingId) => {
    const query = buildingId ? `?buildingId=${buildingId}` : '';
    return apiCall('GET', `/projects/${projectId}/floors${query}`);
  },
  create: (projectId, data) => apiCall('POST', `/projects/${projectId}/floors`, data),
  update: (projectId, floorId, data) =>
    apiCall('PATCH', `/projects/${projectId}/floors/${floorId}`, data),
};

// ============================================================
// UNITS
// ============================================================

export const unitService = {
  list: (projectId) => apiCall('GET', `/projects/${projectId}/units`),
  getById: (projectId, unitId) => apiCall('GET', `/projects/${projectId}/units/${unitId}`),
  create: (projectId, data) => apiCall('POST', `/projects/${projectId}/units`, data),
  update: (projectId, unitId, data) =>
    apiCall('PATCH', `/projects/${projectId}/units/${unitId}`, data),
};

// ============================================================
// PLANS
// ============================================================

export const planService = {
  list: (projectId) => apiCall('GET', `/projects/${projectId}/plans`),
  create: (projectId, data) => apiCall('POST', `/projects/${projectId}/plans`, data),
};

// ============================================================
// ASSETS
// ============================================================

export const assetService = {
  list: (projectId) => apiCall('GET', `/projects/${projectId}/assets`),
  create: (projectId, data) => apiCall('POST', `/projects/${projectId}/assets`, data),
};

// ============================================================
// AMENITIES
// ============================================================

export const amenityService = {
  list: (projectId) => apiCall('GET', `/projects/${projectId}/amenities`),
  create: (projectId, data) => apiCall('POST', `/projects/${projectId}/amenities`, data),
};

// ============================================================
// LOCATION
// ============================================================

export const locationService = {
  get: (projectId) => apiCall('GET', `/projects/${projectId}/location`),
  create: (projectId, data) => apiCall('POST', `/projects/${projectId}/location`, data),
};

// ============================================================
// PUBLICATION
// ============================================================

export const publicationService = {
  create: (projectId, data) => apiCall('POST', `/projects/${projectId}/publication`, data),
  publish: (projectId, data) => apiCall('POST', `/projects/${projectId}/publish`, data),
};
