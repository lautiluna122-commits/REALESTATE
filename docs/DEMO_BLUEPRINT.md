# REALESTATE — Commercial Demo Blueprint

## Purpose

Build a visually convincing, reusable real-estate digital showroom that can be demonstrated to a construction company before the full SaaS platform is production-ready.

The demo is not a disposable mockup. It must exercise the same conceptual structure that will later support many companies and projects.

## Product surfaces

### 1. Internal platform — REALESTATE

The operator controls companies, projects, buildings, floors, units, plans, assets, amenities, locations and publication.

### 2. Company portal

A construction company can manage commercial/project information within its tenant scope: prices, availability/status, descriptions, media, plans and publication settings.

### 3. Public showroom

A public visitor can explore the published project without editing anything.

## Demo journey

1. Project landing / hero.
2. Punta del Este coastal environment.
3. Interactive exterior building view.
4. Day/night presentation.
5. Building overview from multiple angles.
6. Floor selector.
7. Unit selection with status and commercial information.
8. Plan preview.
9. Interior/room experience.
10. Amenities and surroundings.
11. Contact / call to action.

## Architecture rule

One project data model is the source of truth. The visual renderer consumes an experience contract; it must not own commercial data.

```text
Company
  -> Project
      -> Building
          -> Floor
              -> Unit

Project data
  -> Experience contract
      -> Web renderer (Three.js / R3F)
      -> Future premium renderer (Unreal)
```

## Demo project

The initial showcase may use Ocean Mansions / Punta del Este as seed content. Seed content is replaceable and must never become a renderer-specific hardcoded dependency.

## Asset strategy

Use a predictable project asset namespace so future projects can be added without changing application code:

```text
projects/{projectId}/
  exterior/
  interiors/
  plans/
  textures/
  models/
  media/
  location/
```

## Definition of reusable

A second project must be representable by changing data/assets/configuration rather than duplicating the renderer or creating a new application.

## Definition of demo-ready

A prospect can understand the product in less than two minutes and can interact with the building, floors, units and project information without seeing developer-only controls.

## Current priority

Prioritize the smallest end-to-end experience that looks like a premium real-estate showroom. Avoid premature enterprise infrastructure, Unreal integration, automated CAD interpretation and paid services until there is customer validation.
