import React, { useEffect, useState } from 'react';
import ShowroomStable from './experience/ShowroomStable';
import LeadCapture from './experience/LeadCapture';
import AdminPortal from './admin/AdminPortal';
import { hydratePublishedProject } from './platform/projectRegistry';
import './experience/showroom-premium.css';

const API = import.meta.env.VITE_API_BASE_URL || '/api';

class AppErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    if (this.state.error) return <main style={{minHeight:'100vh',display:'grid',placeItems:'center',padding:32,background:'#0b1214',color:'#fff',fontFamily:'Arial,sans-serif'}}><section><p>REALESTATE · Showroom</p><h1>El showroom no pudo iniciar.</h1><pre style={{whiteSpace:'pre-wrap'}}>{String(this.state.error?.stack||this.state.error?.message||this.state.error)}</pre></section></main>;
    return this.props.children;
  }
}

function SharedClientWorkspace({ token }) {
  const [project,setProject]=useState(null),[error,setError]=useState('');
  useEffect(()=>{fetch(`${API}/admin/me`,{headers:{'x-share-token':token}}).then(async r=>{const d=await r.json();if(!r.ok)throw new Error(d.message||'Enlace inválido');if(!d.projectId)throw new Error('Este enlace no está asociado a un proyecto');return fetch(`${API}/admin/projects/${d.projectId}`,{headers:{'x-share-token':token}})}).then(async r=>{const d=await r.json();if(!r.ok)throw new Error(d.message||'No se pudo cargar el proyecto');setProject(d)}).catch(e=>setError(e.message))},[token]);
  if(error)return <main style={{minHeight:'100vh',display:'grid',placeItems:'center',padding:32,background:'#0b1214',color:'#fff'}}><section><p>REALESTATE · Acceso cliente</p><h1>Enlace inválido</h1><p>{error}</p></section></main>;
  if(!project)return <main style={{minHeight:'100vh',display:'grid',placeItems:'center',background:'#0b1214',color:'#fff'}}><p>Cargando workspace…</p></main>;
  return <AdminPortal sharedToken={token} sharedProject={project}/>;
}

function PublicShowroom({ publicSlug }) {
  const [project, setProject] = useState(null);
  const [state, setState] = useState('loading');

  useEffect(() => {
    let cancelled = false;
    setState('loading');
    fetch(`${API}/public/projects/${encodeURIComponent(publicSlug)}`)
      .then(async (response) => {
        if (!response.ok) throw new Error(response.status === 404 ? 'Proyecto no encontrado o no publicado.' : 'No se pudo cargar el proyecto.');
        return response.json();
      })
      .then((payload) => {
        if (cancelled) return;
        const hydrated = hydratePublishedProject(payload);
        if (!hydrated) throw new Error('La publicación no contiene datos válidos.');
        setProject(hydrated);
        setState('ready');
      })
      .catch((error) => {
        if (!cancelled) { setState('error'); setProject(null); }
      });
    return () => { cancelled = true; };
  }, [publicSlug]);

  if (state === 'loading') return <main style={{minHeight:'100vh',display:'grid',placeItems:'center',background:'#0b1214',color:'#f5f1e9',fontFamily:'Arial,sans-serif'}}><p>Cargando showroom…</p></main>;
  if (state === 'error' || !project) return <main style={{minHeight:'100vh',display:'grid',placeItems:'center',padding:32,background:'#0b1214',color:'#fff',fontFamily:'Arial,sans-serif'}}><section><p>REALESTATE</p><h1>Proyecto no encontrado.</h1><p>La publicación solicitada no existe o todavía no está publicada.</p></section></main>;

  return <AppErrorBoundary><ShowroomStable projectId={project.id}/><LeadCapture projectId={project.id}/></AppErrorBoundary>;
}

export default function App() {
  const path = window.location.pathname;
  if (path === '/admin' || path.startsWith('/admin/')) return <AdminPortal />;
  if (path === '/workspace' || path.startsWith('/workspace/')) return <AdminPortal />;
  if (path === '/platform' || path.startsWith('/platform/')) return <AdminPortal platform />;
  const clientMatch = path.match(/^\/cliente\/([^/]+)\/?$/); if (clientMatch) return <SharedClientWorkspace token={clientMatch[1]} />;
  const match = path.match(/^\/proyecto\/([^/]+)\/?$/);
  if (!match) return <main style={{minHeight:'100vh',display:'grid',placeItems:'center',padding:32,background:'#0b1214',color:'#fff',fontFamily:'Arial,sans-serif'}}><section><p>REALESTATE</p><h1>Showroom no encontrado.</h1><p>Ingresá a la URL pública de un proyecto publicado.</p></section></main>;
  return <PublicShowroom publicSlug={match[1]} />;
}
