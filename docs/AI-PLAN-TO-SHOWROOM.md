# REALESTATE — AI Plan-to-Showroom pipeline

## Objective
Turn the material supplied by a developer into a structured showroom draft.

The AI proposes. Validation approves. The canonical database remains the source of truth.

## Inputs
PDF, PNG/JPG, SVG, supported CAD exports, GLB/GLTF/OBJ/FBX exports, renders, 360 panoramas, brochures, spreadsheets and videos.

## Stages
1. Intake: every uploaded file receives a stable Asset identity.
2. Classification: plan, unit plan, elevation, section, render, photo, video, 360, brochure, spreadsheet or unknown.
3. Extraction: floor, building, unit, labels, rooms, dimensions, surfaces, bedrooms, bathrooms, terraces, orientation and references when visually supported.
4. Normalization: map extracted values to Company -> Project -> Building -> Floor -> Unit and related assets.
5. Confidence: every extracted field stores value, source, confidence, note and review state.
6. Visual manifest: generate renderer configuration for building scene, floor navigation, unit anchors, plan links, asset roles, camera presets, hero media, day/night and 360 targets.
7. Human approval: operator/client reviews source image, proposed data, confidence and conflicts before publication.

## Geometry rule
Do not treat a language model as a CAD engine. When exact geometry is needed, use OCR plus image/vector/geometry processing for contours, scale, polygons and anchors; use AI for semantic interpretation and mapping.

## 3D strategy
If a real GLB/GLTF exists, use it as visual source. If only plans/renders exist, use a procedural/parametric representation for navigation and selection. Exact architectural claims require reliable source geometry.

## Publication rule
AI output is never public until approved.
