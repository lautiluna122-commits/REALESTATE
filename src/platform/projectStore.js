const INVENTORY_KEY = (slug) => `realestate:inventory:${slug}`;
const PUBLICATION_KEY = (slug) => `realestate:publication:${slug}`;

function readJson(key, fallback) {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent('realestate:changed', { detail: { key } }));
}

export function getInventoryOverrides(slug) {
  return readJson(INVENTORY_KEY(slug), {});
}

export function saveInventory(slug, units) {
  const overrides = Object.fromEntries(units.map((unit) => [unit.id, {
    price: unit.price,
    currency: unit.currency ?? 'USD',
    status: unit.status,
    updatedAt: new Date().toISOString(),
  }]));
  writeJson(INVENTORY_KEY(slug), overrides);
  return overrides;
}

export function mergeInventory(slug, units) {
  const overrides = getInventoryOverrides(slug);
  return units.map((unit) => overrides[unit.id] ? { ...unit, ...overrides[unit.id] } : unit);
}

export function savePublication(slug, patch) {
  const current = readJson(PUBLICATION_KEY(slug), {});
  const next = { ...current, ...patch, updatedAt: new Date().toISOString() };
  writeJson(PUBLICATION_KEY(slug), next);
  return next;
}

export function getPublication(slug) {
  return readJson(PUBLICATION_KEY(slug), null);
}
