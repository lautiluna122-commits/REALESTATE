const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';
export async function api(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.message || 'Request failed');
  return data;
}
export const adminApi = {
  companies: () => api('/admin/companies'),
  companyProjects: (id) => api(`/admin/companies/${id}/projects`),
  createCompany: (body) => api('/admin/companies', { method: 'POST', body }),
  updateCompany: (id, body) => api(`/admin/companies/${id}`, { method: 'PATCH', body }),
  createProject: (body) => api('/admin/projects', { method: 'POST', body }),
  project: (id) => api(`/admin/projects/${id}`),
  updateProject: (id, body) => api(`/admin/projects/${id}`, { method: 'PATCH', body }),
  resource: (projectId, name) => api(`/admin/projects/${projectId}/${name}`),
  createResource: (projectId, name, body) => api(`/admin/projects/${projectId}/${name}`, { method: 'POST', body }),
  updateResource: (projectId, name, id, body) => api(`/admin/projects/${projectId}/${name}/${id}`, { method: 'PATCH', body }),
  location: (projectId) => api(`/admin/projects/${projectId}/location`),
  saveLocation: (projectId, body) => api(`/admin/projects/${projectId}/location`, { method: 'PUT', body }),
  publish: (projectId, body) => api(`/admin/projects/${projectId}/publish`, { method: 'POST', body }),
  unpublish: (projectId) => api(`/admin/projects/${projectId}/unpublish`, { method: 'POST' }),
};