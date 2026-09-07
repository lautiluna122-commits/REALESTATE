import { useEffect, useState } from 'react';
import { platformApi } from './platformApi';

export default function PublicManifestBridge({ slug, children }) {
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let active = true;
    async function hydrate() {
      try {
        const manifest = await platformApi.getPublicManifest(slug);
        if (!active || !manifest?.project) return;
        const project = manifest.project;
        const normalized = {
          ...manifest,
          project,
          inventory: manifest.units ?? [],
          plans: manifest.plans ?? [],
          assets: manifest.assets ?? [],
          publication: manifest.publication ?? project.publication ?? { publicSlug: slug, publicUrl: `/proyecto/${slug}` },
          status: project.status,
        };
        window.localStorage.setItem(`realestate:project:${slug}`, JSON.stringify(normalized));
        setRevision((value) => value + 1);
      } catch {
        // Local catalog remains the renderer fallback when the platform API is unavailable.
      }
    }
    hydrate();
    return () => { active = false; };
  }, [slug]);

  return <div key={revision} style={{ display: 'contents' }}>{children}</div>;
}
