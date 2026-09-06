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
  return <ShowroomExperience />;
}
