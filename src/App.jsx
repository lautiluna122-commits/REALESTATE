import './experience/cinematic-polish.css';
import ProjectStudio from './admin/ProjectStudio';
import AdminDashboard from './admin/AdminDashboard';
import ClientPortal from './client/ClientPortal';
import PublicExperienceLoader from './platform/PublicExperienceLoader';

function PublicShowroom({ slug }) {
  return <PublicExperienceLoader slug={slug} />;
}

function PublicInterior({ slug }) {
  return <PublicExperienceLoader slug={slug} interior />;
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
  return <PublicExperienceLoader slug="ocean-mansions" />;
}
