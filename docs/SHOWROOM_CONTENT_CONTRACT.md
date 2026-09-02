# Showroom Content Contract

## Purpose

The showroom frontend must consume a normalized project package rather than hard-code a specific development. The visual layer can then be reused for different developers and projects.

## Required project data

```js
{
  id,
  company: { id, name, logo },
  name,
  location: { city, district, country, coordinates },
  branding: { primaryColor, secondaryColor, logo },
  publication: { publicSlug, isPublished },
  building: {
    model: { src, fallback },
    floors: [{ number, label, elevation }]
  },
  units: [{
    id, number, floor, surface, bedrooms, bathrooms, terrace,
    price, currency, status, orientation,
    plan, images, tourUrl, viewDescription
  }],
  plans: [{ id, title, src, type }],
  amenities: [{ id, name, description, image, tourUrl }],
  environment: [{ id, type, src }],
  tours: [{ id, title, url, poster }]
}
```

## Asset policy

1. Never assume a binary asset exists.
2. Every image/model/tour reference must have a graceful fallback.
3. Do not embed project-specific asset paths inside reusable UI components.
4. Keep project content in `src/data/projects/` or a future API response.
5. A missing GLB must never produce a blank application.

## Unit status

Use the existing domain enum:

- `AVAILABLE`
- `RESERVED`
- `SOLD`
- `HIDDEN`

The visual layer should map these to clear, accessible labels and never infer status from price or missing data.

## Rendering strategy

### Tier 1 — real model
If a valid GLB/GLTF exists, load it with a loading state and error fallback.

### Tier 2 — project render
If no model exists, use the project's supplied exterior render as the hero/masterplan instead of pretending the procedural building is the final architectural representation.

### Tier 3 — procedural demo
Use the procedural scene only as a technical fallback for development and interaction testing.

This separation is intentional: professional ArchViz content and the interactive sales platform are different layers of the product.

## Commercial experience

The minimum buyer journey is:

`Intro → Project → Building → Floor → Unit → Unit Detail → Plan/Tour → Amenities → Location → Lead`

Every stage must have an obvious way forward and a way back.

## Future ingestion

A later admin/content pipeline should accept:

- PDF plans
- GLB/GLTF models
- JPG/PNG/WebP renders
- 360 panoramas
- MP4/WebM videos
- unit inventory CSV/XLSX
- amenity media
- location data

The first MVP may use static project data, but its shape must already follow this contract.