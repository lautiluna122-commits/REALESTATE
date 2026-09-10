# Commercial demo checklist

## Must work before showing to a constructor

### Public experience
- [ ] Hero loads without runtime errors.
- [ ] 3D scene is usable on desktop and mobile.
- [ ] Day/night interaction works.
- [ ] Floor filter works.
- [ ] Clicking a unit opens commercial information.
- [ ] Inventory status is visually clear.
- [ ] Project / experience / location sections are coherent.
- [ ] Lead/contact CTA is visible and functional.

### Data
- [ ] No project-specific business data is embedded in reusable platform logic.
- [ ] Company/project/building/floor/unit relationships remain canonical.
- [ ] Prices and availability can be changed without editing the renderer.
- [ ] Draft projects never appear through public publication routes.

### Client operation
- [ ] A constructor can understand where to edit project data.
- [ ] New project creation does not require cloning the app.
- [ ] Publication has an explicit preview/publish boundary.
- [ ] Leads are associated with the project and optional unit.

### Engineering gate
- [ ] `npm run test:api`
- [ ] `npm run build`
- [ ] CI is green.
- [ ] No secrets committed.
- [ ] No SQLite database or `node_modules` committed.

## Commercial demo narrative

Do not sell this as “a 3D website”. Sell it as a digital sales layer for a development:

> The constructor keeps one source of truth for the project. Buyers get an immersive showroom, while the commercial team can update inventory, prices and content without rebuilding the experience.

The strongest proof is a live flow from building → floor → unit → price/status → inquiry.
