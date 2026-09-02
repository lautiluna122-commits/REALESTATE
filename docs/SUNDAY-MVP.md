# Sunday MVP — Digital Real Estate Showroom

Target: Sunday, September 6, 2026.

## Product north

The product is not a generic real-estate website and not a 3D demo. It is a **digital sales showroom**: the user should be able to understand the project, explore the building, choose a floor, inspect a unit, see its plan, and request information without leaving the experience.

Visual reference: premium architectural presentation and product-led simplicity. The interface should show the property first and UI second.

## Sunday acceptance flow

1. Enter showroom.
2. Immediately understand project, location and value proposition.
3. Explore the building in 3D.
4. Switch day/night presentation.
5. Select a floor and see the selected level clearly emphasized.
6. Select a unit and receive price, surface, status and key specs.
7. Open the unit floor plan.
8. Explore the selected unit/interior presentation.
9. Find another unit using inventory filters.
10. Review amenities and location.
11. Open a clear contact/information flow.
12. Experience must remain coherent on desktop and mobile.

## Scope lock

### P0 — must work
- Premium showroom entry and visual hierarchy.
- Stable 3D building scene.
- Floor selection and camera focus.
- Unit selection and inventory data.
- Unit detail card.
- Floor plan modal.
- Day/night mode.
- Unit finder/filtering.
- Contact CTA/modal.
- Amenities and location sections.
- Responsive layout.
- Production build.

### P1 — only if P0 is stable
- Better camera transitions.
- Stronger architectural details and landscaping.
- More convincing interior presentation.
- Better micro-interactions and loading states.

### Explicitly out of scope before Sunday
- Replacing the renderer.
- Rewriting the backend architecture.
- Building a full CMS/admin suite.
- Authentication/authorization redesign unless required to unblock the demo.
- New dependencies without a concrete need.
- Cosmetic rewrites that do not improve the acceptance flow.

## Working rule

Every change must improve one of the acceptance steps above or fix a regression. If it does neither, do not do it before Sunday.

## Validation gate

Before calling the Sunday MVP complete:

- `npm run build` passes.
- `npm run test:api` passes when backend behavior was touched.
- The showroom is visually checked in a real browser.
- No console/runtime errors on the primary flow.
- Desktop and mobile layouts are checked.
