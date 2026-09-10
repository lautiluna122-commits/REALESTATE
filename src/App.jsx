import React from 'react';
import ShowroomStable from './experience/ShowroomStable';
import LeadCapture from './experience/LeadCapture';
import AdminPortal from './admin/AdminPortal';
import { getProjectByPublicSlug } from './platform/projectRegistry';
import './experience/showroom-premium.css';

class AppErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    if (this.state.error) return <main style={{minHeight:'100vh',display:'grid',placeItems:'center',padding:32,background:'#0b1214',color:'#fff',fontFamily:'Arial,sans-serif'}}><section><p>REALESTATE · Showroom</p><h1>El showroom no pudo iniciar.</h1><pre style={{whiteSpace:'pre-wrap'}}>{String(this.state.error?.stack||this.state.error?.message||this.state.error)}</pre></section></main>;
    return this.props.children;
  }
}

export default function App() {
  const path = window.location.pathname;
  if (path === '/admin' || path.startsWith('/admin/')) return <AdminPortal />;
  if (path === '/platform' || path.startsWith('/platform/')) return <AdminPortal platform />;
  const match = path.match(/^\/proyecto\/([^/]+)\/?$/);
  const publicSlug = match?.[1] ?? 'ocean-mansions';
  const project = getProjectByPublicSlug(publicSlug);
  if (!project) return <main style={{minHeight:'100vh',display:'grid',placeItems:'center',padding:32,background:'#0b1214',color:'#fff',fontFamily:'Arial,sans-serif'}}><section><p>REALESTATE</p><h1>Proyecto no encontrado.</h1><p>La publicación solicitada no existe o todavía no está publicada.</p></section></main>;
  return <AppErrorBoundary><ShowroomStable projectId={project.id}/><LeadCapture projectId={project.id}/></AppErrorBoundary>;
}
