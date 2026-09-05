import { createImportedPlan, PLAN_SOURCE_TYPES } from '../domain/planImportModels';

const UNIT_PATTERNS = [
  /\b(?:U|UNIDAD|DEPTO|APTO|APARTAMENTO)[\s-]*(\d{2,4})\b/i,
  /\b(\d{3,4})\b/g,
];

const ROOM_PATTERNS = [
  { type: 'living', regex: /living(?:[-\s]*(?:comedor|room))?/i },
  { type: 'kitchen', regex: /cocina|kitchen/i },
  { type: 'bedroom', regex: /dormitorio|dorm|bedroom|suite/i },
  { type: 'bathroom', regex: /baño|bano|bathroom|toilet/i },
  { type: 'terrace', regex: /terraza|balcón|balcon|terrace|deck/i },
  { type: 'laundry', regex: /lavadero|laundry/i },
  { type: 'hall', regex: /hall|circulación|circulacion/i },
];

function sourceTypeFromName(name = '') {
  const ext = name.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return PLAN_SOURCE_TYPES.PDF;
  if (ext === 'svg') return PLAN_SOURCE_TYPES.SVG;
  if (ext === 'dwg' || ext === 'dxf') return PLAN_SOURCE_TYPES.CAD;
  return PLAN_SOURCE_TYPES.IMAGE;
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

/**
 * Lightweight first-pass adapter for text already available from SVG/OCR/CAD
 * pipelines. It deliberately does not pretend to OCR a binary PDF in-browser.
 * A production PDF/vision adapter can feed its extracted text into this function
 * without changing the showroom contract.
 */
export function extractPlanSignals(text = '') {
  const normalized = String(text).replace(/\s+/g, ' ').trim();
  const units = [];

  for (const pattern of UNIT_PATTERNS) {
    const flags = pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`;
    const regex = new RegExp(pattern.source, flags);
    for (const match of normalized.matchAll(regex)) {
      const number = match[1] ?? match[0];
      if (/^\d{3,4}$/.test(number)) units.push(number);
    }
  }

  const rooms = ROOM_PATTERNS
    .filter(({ regex }) => regex.test(normalized))
    .map(({ type }) => type);

  const floorMatch = normalized.match(/(?:piso|floor|nivel|level)[\s:]*(PB|\d{1,2})\b/i);

  return {
    unitNumbers: unique(units),
    roomTypes: unique(rooms),
    floorLabel: floorMatch?.[1] ?? null,
  };
}

/**
 * Normalize importer output so the renderer never needs to know whether the
 * source was a PDF, image, SVG, CAD export, or AI vision pipeline.
 */
export function normalizePlanImport({
  sourceName,
  sourceType = sourceTypeFromName(sourceName),
  width,
  height,
  page,
  extractedText = '',
  entities = [],
  unitFootprints = [],
  provenance = {},
} = {}) {
  const signals = extractPlanSignals(extractedText);

  const normalizedEntities = [
    ...entities,
    ...signals.unitNumbers.map((number) => ({
      id: `unit-${number}`,
      type: 'unit',
      label: number,
      confidence: 0.72,
      rawText: number,
    })),
    ...signals.roomTypes.map((roomType, index) => ({
      id: `room-${roomType}-${index + 1}`,
      type: 'room',
      roomType,
      confidence: 0.68,
    })),
  ];

  return createImportedPlan({
    sourceName,
    sourceType,
    width,
    height,
    page,
    floorLabel: signals.floorLabel,
    floor: signals.floorLabel && signals.floorLabel !== 'PB' ? Number(signals.floorLabel) : undefined,
    entities: normalizedEntities,
    unitFootprints,
    provenance: {
      source: provenance.source ?? sourceName,
      adapter: provenance.adapter ?? 'signal-normalizer',
      importedAt: provenance.importedAt,
    },
  });
}

export function buildShowroomImportPreview(importedPlan) {
  const units = importedPlan.entities.filter((entity) => entity.type === 'unit');
  const rooms = importedPlan.entities.filter((entity) => entity.type === 'room');

  return {
    floor: importedPlan.floorLabel ?? 'Sin detectar',
    unitsDetected: unique(units.map((unit) => unit.label)),
    roomsDetected: unique(rooms.map((room) => room.roomType)),
    footprintsDetected: importedPlan.unitFootprints.length,
    confidence: units.length ? Math.round((units.reduce((sum, unit) => sum + (unit.confidence ?? 0), 0) / units.length) * 100) : 0,
    readyForMapping: Boolean(units.length || rooms.length || importedPlan.unitFootprints.length),
  };
}
