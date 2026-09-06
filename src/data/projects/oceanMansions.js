import { apartmentData } from '../apartments';
import { createAmenity, createAsset, createCompany, createLocation, createProject, createProjectConfig, createProjectPublication, createUnit, UNIT_STATUS } from '../../domain/platformModels';
import { createProjectAssetManifest } from '../../domain/projectAssetModels';

const statusMap = { Disponible: UNIT_STATUS.AVAILABLE, Reservado: UNIT_STATUS.RESERVED, Vendida: UNIT_STATUS.SOLD };
export const oceanCompany = createCompany({ id: 'company-ocean-group', name: 'Ocean Group', slug: 'ocean-group', country: 'Uruguay' });
export const oceanLocation = createLocation({ id: 'location-punta-del-este', name: 'Punta del Este', district: 'Playa Mansa', city: 'Punta del Este', country: 'Uruguay', coordinates: { lat: -34.9, lng: -54.9 } });
export const oceanAmenities = [
  createAmenity({ id: 'amenity-pool', name: 'Pool Deck', description: 'Deck infinito con vista al mar y solárium.', category: 'recreation' }),
  createAmenity({ id: 'amenity-wellness', name: 'Wellness Club', description: 'Gimnasio, spa y sala de tratamiento.', category: 'wellness' }),
  createAmenity({ id: 'amenity-sky-lounge', name: 'Sky Lounge', description: 'Terraza social para eventos y atardeceres.', category: 'social' }),
  createAmenity({ id: 'amenity-lobby', name: 'Residents Lobby', description: 'Lobby de ingreso con atención y lounges privados.', category: 'entry' }),
];
export const oceanUnits = apartmentData.map((item) => createUnit({ id: item.id, floor: item.floor, number: item.number, surface: item.area, bedrooms: item.bedrooms, bathrooms: item.bathrooms, terrace: item.terrace, price: item.price, currency: 'USD', status: statusMap[item.status] ?? UNIT_STATUS.HIDDEN, description: `${item.bedrooms} dormitorios, ${item.bathrooms} baños y terraza de ${item.terrace} m².`, plan: item.type, modelRef: 'ocean-mansions-building-model', images: [], projectId: 'ocean-mansions' }));

export const oceanProjectConfig = createProjectConfig({
  project: 'residential', building: 'tower', units: 'sales', amenities: ['pool', 'wellness', 'social', 'entry'], environment: ['ocean', 'beach', 'terrain', 'city'], location: ['coast', 'beach', 'city'],
  branding: { primaryColor: '#173b63', secondaryColor: '#d4af69', logo: 'ocean-mansions' },
  typography: { font: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
  content: {
    eyebrow: 'RESIDENCIAL · PUNTA DEL ESTE', heroTitle: 'Vivir frente al mar.', heroSubtitle: 'Explorá Ocean Mansions, recorré sus niveles y encontrá la unidad que mejor se adapta a vos.', introTitle: 'Arquitectura para vivir el horizonte.', introText: 'Un proyecto residencial pensado para combinar arquitectura, amenities y una ubicación privilegiada frente al paisaje de Punta del Este.', unitsEyebrow: 'INVENTARIO', unitsTitle: 'Elegí tu unidad.', unitsText: 'Compará superficies, dormitorios, precios y disponibilidad.', amenitiesEyebrow: 'EXPERIENCIA', amenitiesTitle: 'Más que una residencia.', amenitiesText: 'Espacios diseñados para acompañar cada momento del día.', locationEyebrow: 'UBICACIÓN', locationTitle: 'Todo cerca. El mar, primero.', locationText: 'Playa Mansa, servicios, gastronomía y el ritmo de Punta del Este a pocos minutos.', interiorEyebrow: 'INTERIOR EXPERIENCE', interiorTitle: 'Entrá. Viví el espacio.', interiorText: 'Recorré cada ambiente y descubrí cómo se vive la unidad.', ctaTitle: 'Encontrá tu lugar.', ctaText: 'Conocé disponibilidad, planos y opciones comerciales.'
  },
  experience: { walking: true, floorSelection: true, apartmentTour: true, dayNight: true, quality: 'premium', renderer: 'three-premium' },
});

export const oceanProjectPublication = createProjectPublication({ projectId: 'ocean-mansions', publicSlug: 'ocean-mansions', publicUrl: '/proyecto/ocean-mansions', title: 'Ocean Mansions', description: 'Showroom inmobiliario 3D de Ocean Mansions en Punta del Este.', thumbnail: '/assets/projects/ocean-mansions/thumbnail.jpg', buttonText: 'Explorar proyecto 3D', isPublished: true, customDomain: '' });
const oceanAssets = [
  createAsset({ id: 'asset-ocean-building-model', name: 'Ocean Mansions Building Model', kind: 'buildingModel', path: '/assets/models/ocean-mansions.glb', projectId: 'ocean-mansions', isPrimary: true, source: 'upload', status: 'READY', metadata: { renderer: 'three', fallback: 'procedural' } }),
  createAsset({ id: 'asset-ocean-thumbnail', name: 'Ocean Mansions thumbnail', kind: 'thumbnail', path: '/assets/projects/ocean-mansions/thumbnail.jpg', projectId: 'ocean-mansions', isPrimary: true, source: 'upload', status: 'READY' }),
];
export const oceanMansionsAssetManifest = createProjectAssetManifest({ projectId: 'ocean-mansions', assets: oceanAssets, primary: { buildingModel: oceanAssets[0], thumbnail: oceanAssets[1] } });
export const oceanMansionsProject = createProject({ id: 'ocean-mansions', companyId: oceanCompany.id, name: 'Ocean Mansions', slug: 'ocean-mansions', location: oceanLocation, units: oceanUnits, amenities: oceanAmenities, assets: { buildingModel: oceanAssets[0], thumbnail: oceanAssets[1], plans: [], images: [], environment: [], manifest: oceanMansionsAssetManifest }, publication: oceanProjectPublication, config: oceanProjectConfig, status: 'PUBLISHED' });
