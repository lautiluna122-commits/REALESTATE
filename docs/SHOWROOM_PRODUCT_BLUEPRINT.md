# RealEstate Showroom — Product Blueprint

## North Star

This product is **not** a 3D modeling tool. It is a digital sales layer for real-estate developments.

> **Input:** plans, renders, models, photos, videos, inventory, prices, availability, branding and location data from a developer.
>
> **Output:** a premium, navigable showroom that lets a buyer understand the project, explore the building, find a unit, inspect plans/interiors/amenities, and contact sales.

The platform should progressively turn a developer's existing content into a coherent interactive experience instead of forcing the developer to coordinate a PDF, website, 3D viewer, availability spreadsheet and sales materials separately.

## What the market proves

Urbania publicly describes a workflow that starts with project plans, then a content team produces renders, furnished 3D plans, 360 tours, videos and other visual material before the showroom is assembled. Their product also separates the showroom from the content service: Pro includes content production, Lite reuses part of the client's content, and License is aimed at teams that already have content staff.

This validates the product architecture we want: **content production and interactive software are two layers that can be combined or supplied independently.**

Reference: https://urbania3d.app/

## Our two-layer model

### Layer A — Project Content

Produced by the developer, an architectural visualization specialist, or a future partner network.

- architectural 3D model
- exterior renders
- interior renders
- furnished 2D/3D plans
- 360 panoramas
- videos
- site/masterplan imagery
- amenities imagery
- maps / location imagery
- branding

Recommended specialist tools can vary by supplier: Revit, AutoCAD, SketchUp, 3ds Max, Blender, V-Ray, Corona, Unreal, Photoshop, etc.

**The platform must not depend on the user knowing these tools.**

### Layer B — Showroom Experience

Built by this repository.

- cinematic entry
- masterplan / site context
- interactive building
- floor navigation
- unit selection
- inventory and availability
- unit finder
- unit detail
- plans
- interior media
- 360 viewer
- amenities
- day / sunset / night presentation
- location / POIs
- construction progress
- downloadable technical sheet
- financing information
- lead / WhatsApp CTA
- future analytics / CRM / AI

This is the defensible software layer.

## Product flow

### 01 — Arrival

The first screen must feel like a sales presentation, not a dashboard.

- project identity
- hero visual
- location
- short positioning statement
- immediate CTA: `Explorar proyecto`

### 02 — Masterplan

Give the buyer spatial understanding before showing details.

- building position
- access
- pool / amenities
- landscape
- ocean / city / surroundings
- camera transition toward the building

### 03 — Architecture

The buyer can inspect the building.

- orbit / cinematic camera
- towers or volumes
- floor stack
- day / sunset / night
- hotspots
- building information

### 04 — Units

The showroom becomes a sales tool.

- select floor
- highlight units
- status: available / reserved / sold
- price
- surface
- bedrooms / bathrooms
- terrace
- orientation / view when available

### 05 — Unit detail

A selected unit should feel like opening a product page for a high-value object.

- unit number
- price
- surface
- plan
- gallery
- interior render
- furnished plan
- view / orientation
- CTA

### 06 — Interior / 360

Use the best available visual asset rather than trying to recreate photorealism procedurally.

- 360 panorama when available
- interior render gallery otherwise
- room navigation
- day / night or style variants when available

### 07 — Amenities

Sell the lifestyle.

- pool
- wellness
- lobby
- sky lounge
- gardens
- shared spaces
- render / 360 / video per amenity

### 08 — Location

Show the project in its real context.

- map
- beaches
- restaurants
- schools
- shopping
- transport
- distance / travel time

### 09 — Conversion

Never finish with a dead end.

- request information
- WhatsApp
- schedule a visit
- download unit sheet
- share unit

## Data model

Keep the current architecture and make content progressively richer:

`Company → Project → Building → Floor → Unit`

Additional content entities:

- `Asset`
- `Plan`
- `Amenity`
- `Location`
- `Publication`
- future: `Tour`
- future: `MediaVariant`
- future: `ConstructionUpdate`
- future: `Lead`

The renderer should consume normalized project data. It should not contain project-specific business logic wherever avoidable.

## Asset contract

Every project should be able to arrive as a folder/package with predictable categories:

```text
project/
  brand/
  masterplan/
  exterior/
  interiors/
  plans/
  tours-360/
  amenities/
  location/
  videos/
  model/
  inventory/
  documents/
```

The platform should be able to work with incomplete packages. Missing assets should degrade gracefully:

- no 3D model → use renders / image-based presentation
- no 360 → use interior gallery
- no furnished 3D plan → use original 2D plan
- no night render → use platform lighting treatment
- no location POIs → show basic map

## What makes this product different

Do not compete by claiming to create prettier renders than an architectural visualization studio.

Compete on **what happens after the render exists**:

1. turn visual assets into an interactive project
2. connect them to real inventory
3. let buyers find a unit without asking sales for every detail
4. keep price/status information centralized
5. connect every visual to a commercial action
6. make the experience usable from a single URL

The long-term product can become a reusable showroom engine where a new project is mostly configuration + content ingestion rather than a new codebase.

## Sunday demo priority

Freeze the scope to the visible sales experience.

### Must look excellent

- opening / hero
- masterplan
- building presentation
- unit selection
- unit detail
- interior reveal
- amenities
- day/night
- transitions
- responsive layout
- strong typography and spacing

### Must function

- navigation between sections
- floor selection
- unit selection
- availability status
- unit detail data
- reset / back actions
- CTA

### Explicitly out of scope for Sunday

- authentication
- full multi-tenant permissions
- CRM
- billing
- advanced analytics
- complex admin UX
- production security hardening
- automatic architectural modeling from plans

## Critical product rule

**Never fake production readiness with a procedurally generated building if real project content is available.**

The procedural scene is useful as a technical proof and placeholder. The product demonstration should transition to real project assets as soon as they exist.

## Commercial model to validate

A practical first offer can be structured as:

1. **Showroom + client content** — platform plus implementation
2. **Showroom + outsourced content production** — one supplier/partner coordinates the full experience
3. **License** — for developers/inmobiliarias that already have a content team
4. recurring maintenance / hosting / inventory updates

The first objective is not to build the entire Urbania ecosystem. It is to prove that a developer sees enough value in the showroom to pay for the first project.

## Success criterion

A developer should be able to look at the demo and say:

> “Si te paso mi proyecto, mis renders, mis planos y la disponibilidad, ¿podés convertir esto en algo así?”

If the answer is yes, the product has crossed the important threshold.
