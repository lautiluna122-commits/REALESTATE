# REALESTATE — Product Vision

## The product in one sentence
REALESTATE is a private showroom-generation engine that turns a developer's plans, 3D files, renders, inventory and brand assets into a publishable interactive property experience.

## The three surfaces

### 1. REALESTATE Studio — private / owner only
The operator sees every project in one place.

Flow:
1. Create project.
2. Upload plans, PDF/Excel inventory, GLB/GLTF, renders, logo, videos and 360 assets.
3. AI classifies and extracts information.
4. System validates units, floors, areas and commercial fields.
5. Generate showroom.
6. Open live demo.
7. Approve or request adjustments.
8. Publish.

AI can propose structure/content; it must never silently change price, availability or other commercial truth.

### 2. Client Control — restricted client link
The developer/constructora gets a separate authenticated workspace.

Allowed operations in MVP:
- price
- availability/status
- commercial copy
- approved images
- contact information
- promotions
- view analytics

Not allowed:
- engine/code
- tenant configuration
- other companies/projects
- renderer architecture
- global platform settings

### 3. Public Reader / Embed — buyer-facing
The public experience is read-only.

It can be opened as a direct URL or embedded into a developer's website. It exposes only the published project projection and never private Studio data.

## Canonical flow

```text
REAL ESTATE STUDIO
      ↓
Upload assets + AI ingestion
      ↓
Normalize + validate
      ↓
Generate showroom
      ↓
Live demo
      ↓
Approve / adjust
      ↓
PUBLISH
   ↙       ↘
Client     Public Reader / Embed
Control          ↓
   ↓          Buyer
price/status
analytics
```

## MVP contract
A project is publishable only when it has:
- identity and slug
- branding
- at least one visual/3D representation
- inventory
- public publication state
- a generated showroom manifest

## Product principles
- One engine, many projects.
- Project configuration, not project-specific code.
- Business data is independent from the renderer.
- Private Studio and public showroom are separate trust boundaries.
- AI accelerates ingestion and production; humans approve truth.
- Every release is testable before launch.
- Build the minimum complete commercial loop before adding enterprise features.
