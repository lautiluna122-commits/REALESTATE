import './experience/cinematic-polish.css';
import ProjectStudio from './admin/ProjectStudio';
import ProjectStructure from './admin/ProjectStructure';
import InventoryEditor from './admin/InventoryEditor';
import ClientRequests from './admin/ClientRequests';
import AdminDashboard from './admin/AdminDashboard';
import AdminAuthGate from './admin/AdminAuthGate';
import ClientPortal from './client/ClientPortal';
import PublicExperienceLoader from './platform/PublicExperienceLoader';

function PublicShowroom({ slug }) { return <PublicExperienceLoader slug={slug} />; }
function PublicInterior({ slug }) { return <PublicExperienceLoader slug={slug} interior />; }

export default function App() {
  const path = window.location.pathname.replace(/\/+$/, '') || '/';
  const showroomSlug = path.match(/^\/(?:proyecto|embed)\/([^/]+)/)?.[1] ?? null;
  const interiorSlug = path.match(/^\/proyecto\/([^/]+)\/interior/)?.[1] ?? null;

  if (path === '/' || path === '/admin') return <AdminAuthGate><AdminDashboard /></AdminAuthGate>;
  if (path === '/admin/structure') return <AdminAuthGate><ProjectStructure /></AdminAuthGate>;
  if (path === '/admin/inventory') return <AdminAuthGate><InventoryEditor /></AdminAuthGate>;
  if (path === '/admin/requests') return <AdminAuthGate><ClientRequests /></AdminAuthGate>;
  if (path === '/studio') return <AdminAuthGate><ProjectStudio /></AdminAuthGate>;
  if (path.startsWith('/cliente/')) return <AdminAuthGate><ClientPortal /></AdminAuthGate>;
  if (interiorSlug) return <PublicInterior slug={interiorSlug} />;
  if (showroomSlug) return <PublicShowroom slug={showroomSlug} />;
  return <PublicExperienceLoader slug="ocean-mansions" />;
}
