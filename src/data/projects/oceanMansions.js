import { apartmentData } from '../apartments';
import {
  createAmenity,
  createCompany,
  createLocation,
  createProject,
  createProjectConfig,
  createProjectPublication,
  createUnit,
  UNIT_STATUS,
} from '../../domain/platformModels';

const publicAsset = (path) => `${import.meta.env.BASE_URL}${path}`;

const statusMap = {
  Disponible: UNIT_STATUS.AVAILABLE,
  Reservado: UNIT_STATUS.RESERVED,
  Vendida: UNIT_STATUS.SOLD,
};

export const oceanCompany = createCompany({
  id: 'company-ocean-group',
  name: 'Ocean Group',
  slug: 'ocean-group',
  country: 'Uruguay',
});

export const oceanLocation = createLocation({
  id: 'location-punta-del-este',
  name: 'Punta del Este',
  district: 'Playa Mansa',
  city: 'Punta del Este',
  country: 'Uruguay',
  coordinates: {
    lat: -34.9,
    lng: -54.9,
  },
});

export const oceanAmenities = [
  createAmenity({
    id: 'amenity-pool',
    name: 'Pool Deck',
    description: 'Piscina exterior, deck infinito y solárium orientados al mar.',
    category: 'recreation',
  }),
  createAmenity({
    id: 'amenity-wellness',
    name: 'Wellness Club',
    description: 'Gimnasio, spa y espacios de tratamiento pensados para el bienestar diario.',
    category: 'wellness',
  }),
  createAmenity({
    id: 'amenity-sky-lounge',
    name: 'Sky Lounge',
    description: 'Terraza social privada para encuentros, eventos y atardeceres.',
    category: 'social',
  }),
  createAmenity({
    id: 'amenity-beach-club',
    name: 'Beach Club',
    description: 'Experiencia costera integrada al proyecto, con espacios de descanso y encuentro.',
    category: 'recreation',
  }),
  createAmenity({
    id: 'amenity-lobby',
    name: 'Residents Lobby',
    description: 'Lobby de ingreso con recepción, lounges privados y acceso controlado.',
    category: 'entry',
  }),
  createAmenity({
    id: 'amenity-concierge',
    name: 'Private Concierge',
    description: 'Atención personalizada para residentes y servicios asociados al edificio.',
    category: 'service',
  }),
];

export const oceanUnits = apartmentData.map((item) =>
  createUnit({
    id: item.id,
    floor: item.floor,
    number: item.number,
    surface: item.area,
    bedrooms: item.bedrooms,
    bathrooms: item.bathrooms,
    terrace: item.terrace,
    price: item.price,
    currency: 'USD',
    status: statusMap[item.status] ?? UNIT_STATUS.HIDDEN,
    description: `${item.bedrooms} dormitorios, ${item.bathrooms} baños y terraza de ${item.terrace} m².`,
    plan: item.type,
    modelRef: 'ocean-mansions-building-model',
    images: [],
    projectId: 'ocean-mansions',
  }),
);

export const oceanProjectConfig = createProjectConfig({
  project: 'residential',
  building: 'tower',
  units: 'sales',
  amenities: ['pool', 'wellness', 'social', 'recreation', 'entry', 'service'],
  environment: ['ocean', 'beach', 'terrain', 'city'],
  location: ['coast', 'beach', 'city'],
  branding: {
    primaryColor: '#173b63',
    secondaryColor: '#d4af69',
    logo: 'ocean-mansions',
  },
  experience: {
    walking: true,
    floorSelection: true,
    apartmentTour: true,
    dayNight: true,
  },
});

export const oceanProjectPublication = createProjectPublication({
  projectId: 'ocean-mansions',
  publicSlug: 'ocean-mansions',
  publicUrl: '/proyecto/ocean-mansions',
  title: 'Ocean Mansions',
  description: 'Showroom inmobiliario 3D de Ocean Mansions en Punta del Este.',
  thumbnail: publicAsset('assets/projects/ocean-mansions/thumbnail.jpg'),
  buttonText: 'Explorar proyecto 3D',
  isPublished: true,
  customDomain: '',
});

export const oceanMansionsProject = createProject({
  id: 'ocean-mansions',
  companyId: oceanCompany.id,
  name: 'Ocean Mansions',
  slug: 'ocean-mansions',
  location: oceanLocation,
  units: oceanUnits,
  amenities: oceanAmenities,
  assets: {
    buildingModel: {
      id: 'asset-ocean-building-model',
      name: 'Ocean Mansions Building Model',
      kind: 'glb',
      path: publicAsset('assets/models/ocean-mansions.glb'),
      projectId: 'ocean-mansions',
      isPrimary: true,
    },
    plans: [],
    images: [],
    environment: [],
  },
  publication: oceanProjectPublication,
  config: oceanProjectConfig,
  status: 'PUBLISHED',
});
