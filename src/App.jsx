import './experience/cinematic-polish.css';
import ShowroomExperience from './experience/ShowroomExperience';
import ProjectStudio from './admin/ProjectStudio';
import AdminDashboard from './admin/AdminDashboard';

export default function App() {
  const path = window.location.pathname.replace(/\/+$/, '') || '/';
  if (path === '/admin') return <AdminDashboard />;
  if (path === '/studio') return <ProjectStudio />;
  return <ShowroomExperience />;
}
