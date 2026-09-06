import './experience/cinematic-polish.css';
import CinematicShowroom from './experience/CinematicShowroom';
import ApartmentInterior from './experience/ApartmentInterior';
import ProjectStudio from './admin/ProjectStudio';
import AdminDashboard from './admin/AdminDashboard';
import ClientPortal from './client/ClientPortal';

export default function App() {
  const path = window.location.pathname.replace(/\/+$/, '') || '/';
  if (path === '/' || path === '/admin') return <AdminDashboard />;
  if (path === '/studio') return <ProjectStudio />;
  if (path.startsWith('/cliente/')) return <ClientPortal />;
  if (path.startsWith('/proyecto/') && path.includes('/interior')) return <ApartmentInterior />;
  if (path.startsWith('/proyecto/') || path.startsWith('/embed/')) return <CinematicShowroom />;
  return <CinematicShowroom />;
}
