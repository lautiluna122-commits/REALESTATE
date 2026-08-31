# 3D Experience Engine

## Current implementation
The current experience is implemented inside `src/App.jsx` using React Three Fiber, Drei, and Three.js. It programmatically constructs a stylized building, surroundings, cars, trees, water, lights, and an interior. Orbit controls, floor selection, unit selection, a day/night state, and a simple interior mode are all managed in the component.

`src/experience/projectExperience.js` is a thin adapter around the local project registry. It exposes project data, assets, configuration, and publication metadata, but the main renderer still includes Ocean Mansions-specific assumptions.

## Current limitations
- The scene geometry and environment are procedural/demo-specific rather than loaded project assets.
- `src/App.jsx` directly assumes a 12-floor building, unit number `804`, USD formatting, fixed map labels, and Ocean-oriented context.
- The initial project is resolved at module load, not through a public URL/API lifecycle.
- The frontend consumes local inventory/configuration rather than the SQLite/API source.
- There is no formal renderer DTO, asset manifest, loading policy, LOD strategy, or performance budget.

## Direction
Do not rewrite the renderer in this phase. Future work should:
1. Define an API-backed, versioned experience DTO derived from the canonical project model.
2. Move project-specific presentation values into project configuration/assets.
3. Introduce asset references and loading boundaries before adding heavier 3D features.
4. Define quality/performance budgets and test representative projects.
5. Keep business data outside scene code so Three.js and future Unreal implementations can consume the same contract.
