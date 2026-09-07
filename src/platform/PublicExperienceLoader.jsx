import { Suspense, lazy, useEffect, useState } from 'react';
import { platformApi } from './platformApi';

const CinematicShowroom = lazy(() => import('../experience/CinematicShowroom'));
const ApartmentInterior = lazy(() => import('../experience/ApartmentInterior'));

function Loading({ message = 'Cargando experiencia…' }) {
  return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#071217', color: '#f5f1e8', fontFamily: 'system-ui, sans-serif' }}>{message}</div>;
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
    assets: manifest.assets ?? [],
    publication: manifest.publication ?? { publicSlug: slug, publicUrl: `/proyecto/${slug}` },
  };
  window.localStorage.setItem(`realestate:project:${slug}`, JSON.stringify(normalized));
}

export default function PublicExperienceLoader({ slug, interior = false }) {
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const manifest = await platformApi.getPublicManifest(slug);
        if (!manifest?.project) throw new Error('Public manifest unavailable');
        cacheManifest(slug, manifest);
        if (active) setReady(true);
      } catch {
        // Preserve the local/demo catalog when the API is unavailable.
        if (active) { setFailed(true); setReady(true); }
      }
    }
    load();
    return () => { active = false; };
  }, [slug]);

  if (!ready) return <Loading />;
  if (failed) return <Suspense fallback={<Loading />} >{interior ? <ApartmentInterior /> : <CinematicShowroom />}</Suspense>;
  return <Suspense fallback={<Loading />} >{interior ? <ApartmentInterior /> : <CinematicShowroom />}</Suspense>;
}
