import crypto from 'node:crypto';

const MAX_SERVER_UPLOAD_BYTES = 4_500_000;
const BLOB_API_URL = process.env.VERCEL_BLOB_API_URL || 'https://vercel.com/api/blob';

function readToken() {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!token) throw new Error('Durable object storage is not configured: BLOB_READ_WRITE_TOKEN is required');
  return token;
}

function storeIdFromToken(token) {
  const parts = token.split('_');
  const storeId = parts[3] || '';
  if (!storeId) throw new Error('Invalid BLOB_READ_WRITE_TOKEN: store id could not be resolved');
  return storeId;
}

function safePathname(pathname) {
  const normalized = String(pathname || '').replace(/^\/+/, '');
  if (!normalized || normalized.includes('//') || normalized.includes('..')) throw new Error('Invalid storage pathname');
  if (normalized.length > 950) throw new Error('Storage pathname is too long');
  return normalized;
}

export function storageConfigured() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
}

export function createAssetPath({ companyId, projectId, assetId, filename }) {
  const safeFilename = String(filename || 'asset.bin').replace(/[^a-zA-Z0-9._-]/g, '-');
  return safePathname(`companies/${companyId}/projects/${projectId}/assets/${assetId}/${safeFilename}`);
}

export async function putPublicObject({ pathname, body, contentType = 'application/octet-stream', cacheControlMaxAge = 2592000 }) {
  const token = readToken();
  const safe = safePathname(pathname);
  const size = body?.byteLength ?? body?.length ?? body?.size ?? 0;
  if (size > MAX_SERVER_UPLOAD_BYTES) throw new Error(`Server upload exceeds ${MAX_SERVER_UPLOAD_BYTES} bytes; use a direct Blob upload for larger files`);

  const url = new URL(BLOB_API_URL);
  url.searchParams.set('pathname', safe);
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      authorization: `Bearer ${token}`,
      'x-api-version': '12',
      'x-api-blob-request-id': `${storeIdFromToken(token)}:${Date.now()}:${crypto.randomUUID()}`,
      'x-vercel-blob-access': 'public',
      'x-content-type': contentType,
      'x-add-random-suffix': '0',
      'x-allow-overwrite': '0',
      'x-cache-control-max-age': String(cacheControlMaxAge),
      'content-type': contentType,
    },
    body,
  });

  if (!response.ok) {
    let message = `Blob upload failed with status ${response.status}`;
    try {
      const payload = await response.json();
      message = payload?.error?.message || message;
    } catch {
      // keep status-based message
    }
    throw new Error(message);
  }

  return response.json();
}

export function maxServerUploadBytes() {
  return MAX_SERVER_UPLOAD_BYTES;
}
