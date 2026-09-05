# Plan → Showroom ingestion

The product is designed so a developer can provide architectural plans without manually rebuilding the showroom.

## Target workflow

```text
PDF / SVG / image / CAD
        ↓
Vision / OCR / geometry adapter
        ↓
Normalized ImportedPlan
        ↓
Unit + floor + room mapping
        ↓
Project data model
        ↓
Showroom experience
```

## What the normalized contract captures

- source file and source type
- page / canvas dimensions
- detected floor
- unit labels
- rooms and room types
- doors, windows, fixtures and dimensions when available
- unit footprints / polygons
- confidence per detected entity
- provenance of the adapter that produced the result

The renderer consumes the normalized contract and should not care whether the source was a PDF, image, SVG, CAD export, OCR service, or AI vision model.

## Monday implementation path

1. Add an upload surface in the company/project portal.
2. Send the uploaded PDF/image to a vision/OCR adapter.
3. Convert the adapter response with `normalizePlanImport()`.
4. Show an import preview: detected floor, units, rooms and confidence.
5. Let the operator correct ambiguous unit/floor mappings.
6. Persist the normalized plan against `project → building → floor`.
7. Generate/update unit footprints and plan overlays.
8. Rebuild the showroom from project data — no Three.js component changes required.

## Important boundary

The current browser adapter is intentionally lightweight: it normalizes text/signals that are already extracted. It does **not** claim to OCR arbitrary binary PDFs by itself. A real PDF/vision adapter should be plugged into this contract on Monday.

This keeps the Sunday demo stable while making the ingestion architecture real and replaceable.
