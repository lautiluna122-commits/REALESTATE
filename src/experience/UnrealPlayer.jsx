import { useMemo, useState } from 'react';

export default function UnrealPlayer({ project }) {
  const [failed, setFailed] = useState(false);
  const config = project?.experience?.unreal || project?.experienceConfig?.unreal || project?.config?.experience?.unreal || {};
  const playerUrl = config.playerUrl || config.url || '';
  const label = project?.name || 'Proyecto';
  const src = useMemo(() => {
    if (!playerUrl) return '';
    try {
      const url = new URL(playerUrl, window.location.origin);
      url.searchParams.set('project', project.id);
      if (project.publication?.publicSlug) url.searchParams.set('slug', project.publication.publicSlug);
      return url.toString();
    } catch {
      return playerUrl;
    }
  }, [playerUrl, project.id, project.publication?.publicSlug]);

  if (!src || failed) return null;
  return <section className="unrealPlayer" aria-label={`Showroom Unreal Engine de ${label}`}>
    <iframe
      title={`Showroom Unreal Engine — ${label}`}
      src={src}
      allow="autoplay; fullscreen; gamepad; microphone; xr-spatial-tracking"
      allowFullScreen
      onError={() => setFailed(true)}
      style={{ width: '100%', height: '100%', minHeight: '720px', border: 0, display: 'block', background: '#050709' }}
    />
  </section>;
}
