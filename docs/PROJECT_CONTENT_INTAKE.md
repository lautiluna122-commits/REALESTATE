# Project Content Intake

This checklist defines what a developer can send to turn an existing project into a showroom.

## A. Project basics

- [ ] Project name
- [ ] Developer / company name
- [ ] Logo / brand kit
- [ ] Project description
- [ ] Address / coordinates
- [ ] Sales contact
- [ ] WhatsApp
- [ ] Website / social links

## B. Architecture

Preferred, but not all required:

- [ ] 3D model: GLB / GLTF / FBX / OBJ / SketchUp / other
- [ ] Site / masterplan
- [ ] Floor plans
- [ ] Unit plans
- [ ] Elevations
- [ ] Sections
- [ ] Tower information
- [ ] Floor count
- [ ] Unit numbering convention

If a 3D model is unavailable, the showroom should still work using renders, plans and image/video assets.

## C. Visual content

- [ ] Exterior renders
- [ ] Interior renders
- [ ] Lobby render
- [ ] Amenities renders
- [ ] Pool render
- [ ] Landscape render
- [ ] Views / orientation renders
- [ ] Construction progress images
- [ ] Project videos
- [ ] 360 panoramas

## D. Inventory

Minimum fields:

| Field | Example |
|---|---|
| Unit | 1204 |
| Tower | A |
| Floor | 12 |
| Type | 3 dormitorios |
| Surface | 148 m² |
| Interior | 112 m² |
| Terrace | 36 m² |
| Price | USD 420,000 |
| Status | Disponible |
| Orientation | Norte |
| View | Mar |
| Plan | file |

Possible statuses:

- `AVAILABLE`
- `RESERVED`
- `SOLD`

## E. Amenities

For every amenity, collect:

- name
- short description
- image/render
- 360 URL if available
- video URL if available
- location within project if relevant

## F. Location

- [ ] Google Maps / coordinates
- [ ] beach
- [ ] restaurants
- [ ] schools
- [ ] shopping
- [ ] transport
- [ ] landmarks
- [ ] custom POIs

## G. Commercial information

- [ ] price list
- [ ] financing options
- [ ] payment schedule
- [ ] currency
- [ ] fees / expenses if relevant
- [ ] delivery date
- [ ] brochure PDF
- [ ] technical specifications

## H. Optional premium assets

- [ ] furnished 3D plans
- [ ] 360 tours
- [ ] cinematic video
- [ ] day / sunset / night renders
- [ ] material variants
- [ ] furniture variants
- [ ] construction timeline
- [ ] drone footage

## How we handle missing content

The showroom is designed to accept partial projects.

### Only plans + inventory

Build a clean showroom around plans, unit finder and commercial data.

### Plans + renders + inventory

Add architectural and interior visual storytelling.

### Plans + 3D model + renders + inventory

Enable interactive building/floor/unit exploration.

### Full content package

Enable the premium experience: 3D, 360, video, amenities, location, day/night and cinematic transitions.

## Delivery pipeline

```text
Developer materials
        ↓
Content normalization
        ↓
Project data + asset manifest
        ↓
Showroom configuration
        ↓
Interactive experience
        ↓
Inventory / availability
        ↓
QA on mobile + desktop
        ↓
Public project URL
```

## Important

The platform should make the developer feel that they are handing over one project package, not coordinating a software project.
