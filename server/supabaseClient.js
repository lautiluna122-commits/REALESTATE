const url = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for the production API');
}

const baseUrl = `${url.replace(/\/$/, '')}/rest/v1`;

export async function supabaseRequest(path, { method = 'GET', body, query = {}, headers = {} } = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null) params.set(key, value);
  }

  const response = await fetch(`${baseUrl}/${path}${params.size ? `?${params}` : ''}`, {
    method,
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
      Prefer: method === 'GET' ? 'return=representation' : 'return=representation',
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!response.ok) {
    const message = data?.message || data?.error_description || data?.hint || `Supabase request failed (${response.status})`;
    const error = new Error(message);
    error.status = response.status;
    error.details = data;
    throw error;
  }
  return data;
}

export const select = (table, query = {}) => supabaseRequest(table, { query });
export const insert = (table, rows) => supabaseRequest(table, { method: 'POST', body: rows });
export const update = (table, query, values) => supabaseRequest(table, { method: 'PATCH', query, body: values });
export const remove = (table, query) => supabaseRequest(table, { method: 'DELETE', query });
