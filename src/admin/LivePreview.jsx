import { useEffect, useMemo, useState } from 'react';
import { hydratePublishedProject } from '../platform/projectRegistry';
import ShowroomStable from '../experience/ShowroomStable';

const ASSET_API = import.meta.env.VITE_ASSET_API_BASE_URL || `${import.meta.env.VITE_SUPABASE_URL || ''}/functions/v1/realestate-assets`;

export default function LivePreview({ project, data, apiKey = '', authHeader = 'x-api-key' }) {
  const [heroImageUrl, setHeroImageUrl] = useState('');
  const headers = useMemo(() => ({ [authHeader]: apiKey }), [apiKey, authHeader]);

  useEffect(() => {
    let cancelled = false;
    hydratePublishedProject({
      project,
      publication: data.publication,
      buildings: data.buildings,
      floors: data.floors,
      units: data.units,
      plans: data.plans,
      amenities: data.amenities,
      assets: data.assets,
      location: data.location,
    });

    const primary = (data.assets || []).find((asset) => asset.kind === 'image' && asset.isprimary);
    const fallback = (data.assets || []).find((asset) => asset.kind === 'image');
    const asset = primary || fallback;

    if (asset && authHeader === 'x-api-key' && apiKey) {
      fetch(`${ASSET_API}/assets/${asset.id}/signed-url`, { headers })
        .then((r) => r.ok ? r.json() : null)
        .then((payload) => {
          if (!cancelled) setHeroImageUrl(payload?.url || '');
        })
        .catch(() => {});
    } else {
      setHeroImageUrl('');
    }

    return () => { cancelled = true; };
  }, [project, data, apiKey, authHeader, headers]);

  return (
    <div className="livePreviewFrame">
      <div className="livePreviewBar">
        <span><i /> VISTA EN TIEMPO REAL</span>
        <small>{project.status === 'PUBLISHED' ? 'Publicado' : 'Borrador'} · {data.units?.length || 0} unidades</small>
      </div>
      <div className="livePreviewViewport">
        <ShowroomStable projectId={project.id} heroImageUrl={heroImageUrl} />
      </div>
    </div>
  );
}
