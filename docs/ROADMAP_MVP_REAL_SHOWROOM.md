# Real Showroom MVP — Roadmap

## Objective
Build a reusable digital real-estate showroom that turns a project's existing architectural content into an interactive sales experience. The platform is the product; architectural visualization assets are inputs.

## Benchmark
Current Urbania positioning confirms the target feature set: custom showroom, 360 tours, real-time availability, floor-by-floor navigation, realistic rendering, furnished 3D plans, unit finder, location/POIs, construction progress, amenities, lead capture, finishes, views, financing, night mode, client panel, broker links and analytics. The key product principle is to make the showroom a sales tool, not merely a pretty 3D website.

## MVP — presentation-ready
1. Cinematic project entry.
2. Masterplan/project overview.
3. Building navigation and floor selection.
4. Unit inventory with availability, price and filters.
5. Unit detail with plan/render/content slots.
6. Interior/gallery experience using real project assets when available.
7. Amenities section.
8. Location/context section.
9. Day/night presentation mode.
10. Lead/contact CTA.

## Architecture
- React + Vite + React Three Fiber/Three.js for the experience.
- Existing Express/SQLite services remain available for project/inventory management.
- Project data must be driven by a registry/configuration rather than hard-coded UI values.
- Visual assets must be replaceable without rewriting the experience.
- Missing optional assets must have graceful fallbacks.

## Content pipeline
Input from developer:
- logo/brand
- project description
- site/location
- CAD/PDF plans
- facade/exterior renders
- interior renders
- 360 panoramas
- 3D model if available
- amenity content
- inventory spreadsheet/API
- prices/status
- financing
- contact/WhatsApp

Output:
- project showroom
- unit finder
- interactive building/floor selection
- unit pages
- plan/gallery/360 slots
- commercial CTA

## What not to do now
Do not spend the MVP sprint trying to make procedural geometry look like professional architectural visualization. If real models/renders are available, integrate them. If not, keep procedural geometry as a technical fallback.

## Definition of done
- Production build passes.
- API tests pass.
- No critical runtime errors.
- Public route can be deployed.
- A new project can be introduced primarily through data/assets rather than rewriting the showroom.
- The presentation flow is understandable without a salesperson explaining the UI.
