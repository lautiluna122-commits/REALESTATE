export const ROLE = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  COMPANY_ADMIN: 'COMPANY_ADMIN',
  COMPANY_EDITOR: 'COMPANY_EDITOR',
  PUBLIC_VIEWER: 'PUBLIC_VIEWER',
};

export const UNIT_STATUS = {
  AVAILABLE: 'AVAILABLE',
  RESERVED: 'RESERVED',
  SOLD: 'SOLD',
  HIDDEN: 'HIDDEN',
};

export const STATUS_LABELS = {
  [UNIT_STATUS.AVAILABLE]: 'Disponible',
  [UNIT_STATUS.RESERVED]: 'Reservado',
  [UNIT_STATUS.SOLD]: 'Vendida',
  [UNIT_STATUS.HIDDEN]: 'Oculta',
};

export function createCompany({ id, name, slug, country = 'Uruguay' }) {
  return { id, name, slug, country, kind: 'company' };
}

export function createUser({ id, companyId = null, name, email, role = ROLE.PUBLIC_VIEWER }) {
  return { id, companyId, name, email, role, kind: 'user' };
}

export function createLocation({ id, name, district, city, country, coordinates = { lat: 0, lng: 0 } }) {
  return { id, name, district, city, country, coordinates, kind: 'location' };
}

export function createAmenity({ id, name, description, category = 'common' }) {
  return { id, name, description, category, kind: 'amenity' };
}

export function createAsset({
  id,
  name,
  kind,
  path,
  projectId,
  isPrimary = false,
  source = 'upload',
  status = 'READY',
  mimeType = '',
  size = 0,
  floor = null,
  unitId = null,
  tags = [],
  metadata = {},
}) {
  return {
    id,
    name,
    kind,
    path,
    projectId,
    isPrimary,
    source,
    status,
    mimeType,
    size,
    floor,
    unitId,
    tags,
    metadata,
    kindAsset: 'asset',
  };
}

export function createPlan({ id, name, path, unitId = null, floor = null, sourceType = 'image', importedPlan = null }) {
  return { id, name, path, unitId, floor, sourceType, importedPlan, kind: 'plan' };
}

export function createProjectPublication({ projectId, publicSlug, publicUrl, title, description, thumbnail, buttonText = 'Explorar en 3D', isPublished = false, customDomain = '' }) {
  return { projectId, publicSlug, publicUrl, title, description, thumbnail, buttonText, isPublished, customDomain, kind: 'projectPublication' };
}

export function createProjectConfig({
  project = 'residential',
  building = 'tower',
  units = 'sales',
  amenities = ['pool', 'wellness'],
  environment = ['ocean', 'beach'],
  location = ['city', 'coast'],
  branding = {},
  experience = { walking: true, floorSelection: true, apartmentTour: true, dayNight: true },
}) {
  return { project, building, units, amenities, environment, location, branding, experience, kind: 'projectConfig' };
}

export function createUnit({ id, floor, number, surface, bedrooms, bathrooms, terrace, price, currency = 'USD', status = UNIT_STATUS.AVAILABLE, description = '', plan = '', modelRef = '', images = [], projectId = '' }) {
  return { id, floor, number, surface, bedrooms, bathrooms, terrace, price, currency, status, description, plan, modelRef, images, projectId, kind: 'unit' };
}

export function createProject({ id, companyId, name, slug, location, units = [], amenities = [], assets = {}, publication, config, status = 'DRAFT' }) {
  return { id, companyId, name, slug, location, units, amenities, assets, publication, config, status, kind: 'project' };
}
