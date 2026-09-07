import { useEffect } from 'react';
import './experience/cinematic-polish.css';
import CinematicShowroom from './experience/CinematicShowroom';
import ApartmentInterior from './experience/ApartmentInterior';
import ProjectStudio from './admin/ProjectStudio';
import AdminDashboard from './admin/AdminDashboard';
import ClientPortal from './client/ClientPortal';
import { getProjectBySlug } from './platform/projectRegistry';
import { ANALYTICS_EVENT, trackShowroomEvent } from './platform/analytics';

function ShowroomAnalyticsTracker({ slug }) {
  useEffect(() => {
    const project = getProjectBySlug(slug);
    const projectId = project?.id;
    if (!projectId) return;
    trackShowroomEvent(projectId, ANALYTICS_EVENT.SHOWROOM_OPEN, { metadata: { surface: window.location.pathname.startsWith('/embed/') ? 'embed' : 'showroom' } });
  }, [slug]);
  return null;
}

export default function App() {
  const path = window.location.pathname.replace(/\/+$/, '') || '/';
  const showroomSlug = path.match(/^\/(?:proyecto|embed)\/([^/]+)/)?.[1] ?? null;

  if (path === '/' || path === '/admin') return <AdminDashboard />;
  if (path === '/studio') return <ProjectStudio />;
  if (path.startsWith('/cliente/')) return <ClientPortal />;
  if (path.startsWith('/proyecto/') && path.includes('/interior')) return <ApartmentInterior />;
  if (path.startsWith('/proyecto/') || path.startsWith('/embed/')) return <><ShowroomAnalyticsTracker slug={showroomSlug} /><CinematicShowroom /></>;
  return <CinematicShowroom />;
}
