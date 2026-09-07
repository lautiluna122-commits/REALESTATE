import { useEffect } from 'react';
import './experience/cinematic-polish.css';
import CinematicShowroom from './experience/CinematicShowroom';
import ApartmentInterior from './experience/ApartmentInterior';
import ProjectStudio from './admin/ProjectStudio';
import AdminDashboard from './admin/AdminDashboard';
import ClientPortal from './client/ClientPortal';
import { platformApi } from './platform/platformApi';
import { ANALYTICS_EVENT, trackShowroomEvent } from './platform/analytics';
import PublicManifestBridge from './platform/PublicManifestBridge';

function ShowroomAnalyticsTracker({ slug }) {
  useEffect(() => {
    let active = true;
    async function track() {
      try {
        const project = await platformApi.getProjectBySlug(slug);
        if (active && project?.id) await trackShowroomEvent(project.id, ANALYTICS_EVENT.SHOWROOM_OPEN, { metadata: { surface: window.location.pathname.startsWith('/embed/') ? 'embed' : 'showroom' } });
      } catch {
        // The visual showroom remains available when the API is offline.
      }
    }
    track();
    return () => { active = false; };
  }, [slug]);
  return null;
}

function PublicShowroom({ slug }) {
  return <PublicManifestBridge slug={slug}><ShowroomAnalyticsTracker slug={slug} /><CinematicShowroom /></PublicManifestBridge>;
}

function PublicInterior({ slug }) {
  return <PublicManifestBridge slug={slug}><ApartmentInterior /></PublicManifestBridge>;
}

export default function App() {
  const path = window.location.pathname.replace(/\/+$/, '') || '/';
  const showroomSlug = path.match(/^\/(?:proyecto|embed)\/([^/]+)/)?.[1] ?? null;
  const interiorSlug = path.match(/^\/proyecto\/([^/]+)\/interior/)?.[1] ?? null;

  if (path === '/' || path === '/admin') return <AdminDashboard />;
  if (path === '/studio') return <ProjectStudio />;
  if (path.startsWith('/cliente/')) return <ClientPortal />;
  if (interiorSlug) return <PublicInterior slug={interiorSlug} />;
  if (showroomSlug) return <PublicShowroom slug={showroomSlug} />;
  return <CinematicShowroom />;
}
