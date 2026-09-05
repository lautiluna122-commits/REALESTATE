/**
 * Canonical contract between uploaded architectural plans and the showroom.
 *
 * The importer is intentionally renderer-neutral: OCR/CAD/PDF/AI adapters should
 * normalize into this shape before the experience consumes the project data.
 */
export const PLAN_IMPORT_VERSION = '1.0';

export const PLAN_SOURCE_TYPES = Object.freeze({
  PDF: 'pdf',
  SVG: 'svg',
  IMAGE: 'image',
  CAD: 'cad',
});

export const PLAN_ENTITY_TYPES = Object.freeze({
  BUILDING: 'building',
  FLOOR: 'floor',
  UNIT: 'unit',
  ROOM: 'room',
  DOOR: 'door',
  WINDOW: 'window',
  FIXTURE: 'fixture',
  DIMENSION: 'dimension',
});

/**
 * @typedef {Object} PlanEntity
 * @property {string} id
 * @property {string} type
 * @property {string=} label
 * @property {number=} confidence 0..1
 * @property {{x:number,y:number,width?:number,height?:number,rotation?:number}=} bbox
 * @property {{x:number,y:number}[]=} polygon
 * @property {string=} unitId
 * @property {string=} roomType
 * @property {string=} rawText
 */

/**
 * @typedef {Object} ImportedPlan
 * @property {string} version
 * @property {string} sourceName
 * @property {string} sourceType
 * @property {number=} page
 * @property {number=} width
 * @property {number=} height
 * @property {string=} floorLabel
 * @property {number=} floor
 * @property {PlanEntity[]} entities
 * @property {{unitId:string, polygon:number[][], confidence:number}[]} unitFootprints
 * @property {{source:string, importedAt:string, adapter:string}} provenance
 */

export function createImportedPlan(input = {}) {
  return {
    version: PLAN_IMPORT_VERSION,
    sourceName: input.sourceName ?? 'plan',
    sourceType: input.sourceType ?? PLAN_SOURCE_TYPES.IMAGE,
    page: input.page,
    width: input.width,
    height: input.height,
    floorLabel: input.floorLabel,
    floor: input.floor,
    entities: Array.isArray(input.entities) ? input.entities : [],
    unitFootprints: Array.isArray(input.unitFootprints) ? input.unitFootprints : [],
    provenance: {
      source: input.provenance?.source ?? 'unknown',
      importedAt: input.provenance?.importedAt ?? new Date().toISOString(),
      adapter: input.provenance?.adapter ?? 'manual',
    },
  };
}
