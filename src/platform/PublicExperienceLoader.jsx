import { Suspense, lazy, useEffect, useState } from 'react';
import { platformApi } from './platformApi';
import { ANALYTICS_EVENT, trackShowroomEvent } from './analytics';

const CinematicShowroom = lazy(() => import('../experience/CinematicShowroom'));
const ApartmentInterior = lazy(() => import('../experience/ApartmentInterior'));

function Loading({ message = 'Cargando experiencia…' }) {
  return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#071217', color: '#f5f1e8', fontFamily: 'system-ui, sans-serif' }}>{message}</div>;
}

function normalizeAssets(assets = []) {
  if (!Array.isArray(assets)) return assets;
  const manifest = { assets: assets.filter((asset) => asset?.path) };
  for (const asset of manifest.assets) {
    if (asset.kind && !manifest[asset.kind]) manifest[asset.kind] = asset;
  }
  return manifest;
}

function cacheManifest(slug, manifest) {
  const normalized = {
    ...manifest,
    project: {
      ...manifest.project,
      config: {
        ...(manifest.project?.config ?? {}),
        branding: manifest.project?.branding ?? manifest.project?.config?.branding,
        experience: manifest.project?.environmentConfig?.experience ?? manifest.project?.config?.experience,
      },
    },
    inventory: manifest.units ?? [],
    plans: manifest.plans ?? [],
    assets: normalizeAssets(manifest.assets),
    amenities: manifest.amenities ?? [],
    buildings: manifest.buildings ?? [],
    floors: manifest.floors ?? [],
    location: manifest.location ?? manifest.project?.location ?? null,
    publication: manifest.publication ?? { publicSlug: slug, publicUrl: `/proyecto/${slug}`, isPublished: true },
  };
  window.localStorage.setItem(`realestate:project:${slug}`, JSON.stringify(normalized));
}

export default function PublicExperienceLoader({ slug, interior = false }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const manifest = await platformApi.getPublicManifest(slug);
        if (!manifest?.project) throw new Error('Public manifest unavailable');
        cacheManifest(slug, manifest);
      } catch {
        // Preserve the local/demo catalog when the API is unavailable.
      } finally {
        if (active) setReady(true);
      }
    }
    load();
    return () => { active = false; };
  }, [slug]);

  useEffect(() => {
    if (!ready) return;
    trackShowroomEvent({
      projectId: projectIdForSlug(slug),
      event: interior ? ANALYTICS_EVENT.INTERIOR_OPEN : ANALYTICS_EVENT.SHOWROOM_OPEN,
      metadata: { slug, surface: interior ? 'interior' : 'showroom' },
    });
  }, [ready, slug, interior]);

  if (!ready) return <Loading />;
  return (
    <Suspense fallback={<Loading />}>
      {interior ? <ApartmentInterior /> : <CinematicShowroom />}
    </Suspense>
  );
}

function projectIdForSlug(slug) {
  try {
    const cached = window.localStorage.getItem(`realestate:project:${slug}`);
    return cached ? JSON.parse(cached)?.project?.id ?? null : null;
  } catch {
    return null;
  }
}
