const DEFAULT_THEME = {
  branding: { primary: '#173b63', accent: '#d4af69', surface: '#f2eee7', ink: '#17232b', logo: null },
  typography: { font: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
  content: {
    eyebrow: 'RESIDENCIAL · PUNTA DEL ESTE',
    heroTitle: 'Vivir frente al mar.',
    heroSubtitle: 'Explorá el proyecto, recorré sus niveles y encontrá la unidad que mejor se adapta a vos.',
    introTitle: 'Arquitectura para vivir el horizonte.', introText: 'Una experiencia digital pensada para presentar el proyecto, su arquitectura, amenities y disponibilidad desde un único lugar.',
    unitsEyebrow: 'INVENTARIO', unitsTitle: 'Elegí tu unidad.', unitsText: 'Compará superficies, dormitorios, precios y disponibilidad en tiempo real.',
    amenitiesEyebrow: 'EXPERIENCIA', amenitiesTitle: 'Más que una residencia.', amenitiesText: 'Espacios diseñados para que cada momento del día tenga su propio lugar.',
    locationEyebrow: 'UBICACIÓN', locationTitle: 'Todo cerca. El mar, primero.', locationText: 'Descubrí el entorno del proyecto y sus principales puntos de interés.',
    interiorEyebrow: 'INTERIOR EXPERIENCE', interiorTitle: 'Entrá. Viví el espacio.', interiorText: 'Recorré cada ambiente, descubrí materiales y elegí la unidad que mejor se adapta a vos.',
    ctaTitle: 'Encontrá tu lugar.', ctaText: 'Conocé disponibilidad, planos y opciones comerciales.',
  },
};

function pick(value, fallback) { return value == null || value === '' ? fallback : value; }

export function getShowroomTheme(project = {}) {
  const config = project.config ?? {};
  const branding = config.branding ?? {};
  const typography = config.typography ?? {};
  const content = config.content ?? {};
  return {
    branding: {
      primary: pick(branding.primary, pick(branding.primaryColor, DEFAULT_THEME.branding.primary)),
      accent: pick(branding.accent, pick(branding.secondaryColor, DEFAULT_THEME.branding.accent)),
      surface: pick(branding.surface, DEFAULT_THEME.branding.surface), ink: pick(branding.ink, DEFAULT_THEME.branding.ink), logo: pick(branding.logo, DEFAULT_THEME.branding.logo),
    },
    typography: { font: pick(typography.font, DEFAULT_THEME.typography.font) },
    content: Object.fromEntries(Object.entries(DEFAULT_THEME.content).map(([key, fallback]) => [key, pick(content[key], fallback)])),
  };
}

export { DEFAULT_THEME };
