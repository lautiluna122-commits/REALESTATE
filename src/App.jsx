import React, { lazy, Suspense, useEffect, useState } from 'react';
const ShowroomStable = lazy(() => import('./experience/ShowroomStable'));
const LeadCapture = lazy(() => import('./experience/LeadCapture'));
const AdminPortal = lazy(() => import('./admin/AdminPortal'));
import { hydratePublishedProject, getProjectByPublicSlug } from './platform/projectRegistry';
import './experience/showroom-premium.css';
import './experience/visual-exploration.css';

const API = import.meta.env.VITE_API_BASE_URL || '/api';

function RouteLoading({ label = 'Cargando REALESTATE…' }) {
  return <main style={{minHeight:'100vh',display:'grid',placeItems:'center',background:'#0b1214',color:'#f5f1e9',fontFamily:'Arial,sans-serif'}}><p>{label}</p></main>;
}

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
  return <Suspense fallback={<RouteLoading label="Cargando workspace…" />}><AdminPortal sharedToken={token} sharedProject={project}/></Suspense>;
}

function PublicShowroom({ publicSlug }) {
  const [project, setProject] = useState(null);
  const [state, setState] = useState('loading');

  useEffect(() => {
    let cancelled = false;
    const localFallback = getProjectByPublicSlug(publicSlug);
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
      .catch(() => {
        if (cancelled) return;
        if (localFallback) {
          setProject(localFallback);
          setState('ready');
        } else {
          setState('error');
          setProject(null);
        }
      });
    return () => { cancelled = true; };
  }, [publicSlug]);

  if (state === 'loading') return <RouteLoading label="Cargando showroom…" />;
  if (state === 'error' || !project) return <main style={{minHeight:'100vh',display:'grid',placeItems:'center',padding:32,background:'#0b1214',color:'#fff',fontFamily:'Arial,sans-serif'}}><section><p>REALESTATE</p><h1>Proyecto no encontrado.</h1><p>La publicación solicitada no existe o todavía no está publicada.</p></section></main>;

  return <Suspense fallback={<RouteLoading label="Cargando showroom…" />}><AppErrorBoundary><ShowroomStable projectId={project.id}/><LeadCapture projectId={project.id}/></AppErrorBoundary></Suspense>;
}

function Home() {
  const demo = getProjectByPublicSlug('ocean-mansions');
  return <main style={{minHeight:'100vh',display:'grid',placeItems:'center',padding:32,background:'#0b1214',color:'#f5f1e9',fontFamily:'Arial,sans-serif'}}><section style={{maxWidth:760,width:'100%'}}><p style={{letterSpacing:3,opacity:.7}}>REALESTATE</p><h1 style={{fontSize:'clamp(42px,7vw,82px)',lineHeight:.95,margin:'18px 0'}}>Property,<br/><i>reimagined.</i></h1><p style={{fontSize:18,lineHeight:1.6,maxWidth:620,opacity:.8}}>Plataforma interactiva para crear, administrar y publicar experiencias digitales de proyectos inmobiliarios.</p><div style={{display:'flex',gap:12,flexWrap:'wrap',marginTop:28}}><a href="/proyecto/ocean-mansions" style={{padding:'14px 20px',background:'#f5f1e9',color:'#0b1214',textDecoration:'none'}}>Ver showroom demo ↗</a><a href="/admin" style={{padding:'14px 20px',border:'1px solid #536062',color:'#f5f1e9',textDecoration:'none'}}>Panel administrativo</a><a href="/platform" style={{padding:'14px 20px',border:'1px solid #536062',color:'#f5f1e9',textDecoration:'none'}}>Panel maestro</a></div><small style={{display:'block',marginTop:28,opacity:.45}}>{demo?.name || 'Showroom demo'} · entorno de demostración</small></section></main>;
}

export default function App() {
  const path = window.location.pathname;
  if (path === '/' || path === '') return <Home />;
  if (path === '/admin' || path.startsWith('/admin/')) return <Suspense fallback={<RouteLoading />}><AdminPortal /></Suspense>;
  if (path === '/workspace' || path.startsWith('/workspace/')) return <Suspense fallback={<RouteLoading />}><AdminPortal /></Suspense>;
  if (path === '/platform' || path.startsWith('/platform/')) return <Suspense fallback={<RouteLoading />}><AdminPortal platform /></Suspense>;
  const clientMatch = path.match(/^\/cliente\/([^/]+)\/?$/); if (clientMatch) return <SharedClientWorkspace token={clientMatch[1]} />;
  const match = path.match(/^\/proyecto\/([^/]+)\/?$/);
  if (!match) return <Home />;
  return <PublicShowroom publicSlug={match[1]} />;
}
