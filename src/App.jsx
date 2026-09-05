import './experience/cinematic-polish.css';
import ShowroomExperience from './experience/ShowroomExperience';
import ProjectStudio from './admin/ProjectStudio';

export default function App() {
  const path = window.location.pathname.replace(/\/+$/, '') || '/';
  return path === '/admin' || path === '/studio' ? <ProjectStudio /> : <ShowroomExperience />;
}
