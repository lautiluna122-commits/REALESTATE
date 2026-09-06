import './experience/cinematic-polish.css';
import ShowroomExperience from './experience/ShowroomExperience';
import ProjectStudio from './admin/ProjectStudio';
import AdminDashboard from './admin/AdminDashboard';
import ClientPortal from './client/ClientPortal';

export default function App() {
  const path = window.location.pathname.replace(/\/+$/, '') || '/';
  if (path === '/' || path === '/admin') return <AdminDashboard />;
  if (path === '/studio') return <ProjectStudio />;
  if (path.startsWith('/cliente/')) return <ClientPortal />;
  // /proyecto/:slug is the full showroom; /embed/:slug is the same experience
  // exposed as the read-only surface intended for an iframe or client website.
  return <ShowroomExperience />;
}
