# REALESTATE Demo Checkpoint

## Purpose

This branch is the first commercial-demo track. It must let us show the product direction without pretending the production SaaS is complete.

## Three experiences

1. **Platform admin** — our internal source of truth for companies, projects, buildings, floors, units, plans, assets, amenities, locations and publications.
2. **Company portal** — a controlled editing surface for a developer/constructor: prices, availability, descriptions, media and publication settings.
3. **Public showroom** — read-only experience reached from a project link or a button embedded in the company's website.

## Demo journey

`Project → Building → Exterior → Floor → Unit → Plan → Interior → Amenities → Location → Contact`

## Renderer boundary

Project data must not be encoded inside Three.js components. The experience contract is the boundary between data and the visual renderer. The web renderer is the first implementation; a future Unreal renderer must be able to consume the same experience contract.

## Commercial demo standard

The demo should communicate:

- premium residential architecture
- Punta del Este / Playa Mansa context
- interactive building exploration
- unit selection
- inventory visibility
- floor selection
- plans and media
- day/night capability
- public sharing
- future company branding

## What is deliberately deferred

Production authentication, cloud object storage, automated CAD/DWG interpretation, drone/photogrammetry ingestion, billing, and a production Unreal pipeline are not blockers for the first sales demo.

## Current URLs

- `/demo` — commercial platform shell
- `/` — existing Three.js experience

The demo shell is intentionally additive and does not replace the existing renderer.
