import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
const LivePreview = lazy(() => import('./LivePreview'));
import './admin.css';
import ProjectBuilder from './ProjectBuilder';

const API = import.meta.env.VITE_API_BASE_URL || '/api';
const request = async (path, options={}) => { const r=await fetch(`${API}${path}`,options); const d=await r.json().catch(()=>({})); if(!r.ok) throw new Error(d.message||`Error ${r.status}`); return d; };
const json=(method,body,headers)=>({method,headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify(body)});
const Field=({label,...p})=><label className="adminField"><span>{label}</span><input {...p}/></label>;
const Notice=({children})=>children?<div className="adminNotice">{children}</div>:null;
function Login({title,subtitle,value,setValue,onSubmit,error,onBack}){return <main className="adminLogin"><div className="loginBox"><span className="adminLogo">RE</span><span className="adminKicker">REALESTATE PLATFORM</span><h1>{title}</h1><p>{subtitle}</p><form onSubmit={e=>{e.preventDefault();onSubmit()}}><Field label="Clave de acceso" type="password" value={value} onChange={e=>setValue(e.target.value)} required/><button className="adminPrimary">Entrar</button></form><Notice>{error}</Notice><button className="adminGhost" onClick={onBack}>← Volver</button></div></main>}
function Shell({brand,subtitle,onBack,children}){return <div className="adminApp"><header className="adminHeader"><div><b>RE</b><strong>{brand}</strong><small>{subtitle}</small></div><button className="adminGhost" onClick={onBack}>Salir</button></header>{children}</div>}
function TenantPortal({apiKey,onLogout}){const headers=useMemo(()=>({'x-api-key':apiKey}),[apiKey]);const [company,setCompany]=useState(null),[projects,setProjects]=useState([]),[selected,setSelected]=useState(null),[form,setForm]=useState({name:'',slug:'',description:''}),[error,setError]=useState('');const load=async()=>{const [me,list]=await Promise.all([request('/admin/me',{headers}),request('/admin/projects',{headers})]);setCompany(me);setProjects(list)};useEffect(()=>{load().catch(e=>setError(e.message))},[apiKey]);const create=async e=>{e.preventDefault();try{const p=await request('/admin/projects',json('POST',form,headers));setForm({name:'',slug:'',description:''});await load();setSelected(p)}catch(e){setError(e.message)}};if(selected)return <ProjectBuilder project={selected} apiKey={apiKey} onRefresh={load} onBack={()=>setSelected(null)}/>;return <Shell brand={company?.name||'Constructora'} subtitle="Workspace" onBack={onLogout}><main className="adminMain"><div className="workspaceHead"><div><span className="adminKicker">CLIENT WORKSPACE</span><h1>Proyectos</h1><p>Fuente única para estructura, inventario, contenido, IA, experiencia y publicación.</p></div></div><Notice>{error}</Notice><div className="contentGrid"><article className="adminPanel"><span className="adminKicker">NUEVO PROYECTO</span><h2>Crear showroom</h2><form onSubmit={create}><Field label="Nombre" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required/><Field label="Slug" value={form.slug} onChange={e=>setForm({...form,slug:e.target.value})}/><label className="adminField"><span>Descripción</span><textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></label><button className="adminPrimary">Crear proyecto</button></form></article><article className="adminPanel"><span className="adminKicker">MIS PROYECTOS</span><h2>{projects.length} proyectos</h2>{projects.map(p=><button className="projectCard" key={p.id} onClick={()=>setSelected(p)}><b>{p.name}</b><span>{p.slug}</span><em>{p.status}</em></button>)}</article></div></main></Shell>}
function PlatformPortal({platformKey,onLogout}){
  const headers=useMemo(()=>({'x-platform-key':platformKey}),[platformKey]);
  const [companies,setCompanies]=useState([]);
  const [projects,setProjects]=useState([]);
  const [selectedProject,setSelectedProject]=useState(null);
  const [selectedData,setSelectedData]=useState(null);
  const [error,setError]=useState('');
  const [showCreate,setShowCreate]=useState(false);
  const [form,setForm]=useState({name:'',slug:''});
  const [createdKey,setCreatedKey]=useState('');
  const load=async()=>{
    try{
      const c=await request('/admin/companies',{headers});
      setCompanies(c);
      const groups=await Promise.all(c.map(company=>request(`/platform/companies/${company.id}/projects`,{headers}).catch(()=>[])));
      setProjects(groups.flat());
    }catch(e){setError(e.message)}
  };
  useEffect(()=>{load()},[platformKey]);
  const createCompany=async e=>{
    e.preventDefault();
    try{
      const result=await request('/admin/companies',json('POST',form,headers));
      setCreatedKey(result.apiKey||'');
      setForm({name:'',slug:''});
      setShowCreate(false);
      await load();
    }catch(e){setError(e.message)}
  };
  const openProject=async project=>{
    setSelectedProject(project);
    setSelectedData(null);
    setError('');
    try{
      const full=await request(`/platform/projects/${project.id}/full`,{headers});
      setSelectedData(full);
    }catch(e){setError(e.message)}
  };
  const closeProject=()=>{setSelectedProject(null);setSelectedData(null)};
  return <Shell brand="Platform Owner" subtitle="Control central" onBack={onLogout}>
    <main className="platformOverview">
      <div className="overviewHead">
        <div><span className="adminKicker">PLATFORM CONTROL · LIVE</span><h1>El ecosistema.</h1><p>Empresas, proyectos y experiencias en una sola fuente de verdad. Seleccioná un proyecto para abrir su vista en tiempo real.</p></div>
        <button className="adminPrimary" onClick={()=>setShowCreate(true)}>+ Nueva constructora</button>
      </div>
      <Notice>{error}</Notice>
      {createdKey&&<article className="adminPanel platformKeyPanel"><span className="adminKicker">API KEY GENERADA</span><h2>Guardala ahora</h2><p>La clave de la nueva constructora se muestra una sola vez en esta sesión.</p><code>{createdKey}</code><button className="adminGhost" onClick={()=>setCreatedKey('')}>Cerrar</button></article>}
      {showCreate&&<article className="adminPanel platformCreatePanel"><span className="adminKicker">NUEVA CONSTRUCTORA</span><h2>Alta de empresa</h2><form onSubmit={createCompany}><Field label="Nombre" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required/><Field label="Slug" value={form.slug} onChange={e=>setForm({...form,slug:e.target.value})} placeholder="empresa-demo"/><div className="buttonRow"><button className="adminPrimary">Crear</button><button type="button" className="adminGhost" onClick={()=>setShowCreate(false)}>Cancelar</button></div></form></article>}
      <div className="adminStats"><div><strong>{companies.length}</strong><span>Empresas</span></div><div><strong>{projects.length}</strong><span>Proyectos</span></div><div><strong>{projects.filter(p=>p.status==='PUBLISHED').length}</strong><span>Publicados</span></div><div><strong>{projects.reduce((n,p)=>n+(p.unitCount||0),0)}</strong><span>Inventario</span></div></div>
      <div className="platformLiveGrid">
        <article className="adminPanel platformProjectList">
          <div className="panelTitle"><span>PROYECTOS</span><small>{projects.length} TOTAL</small></div>
          {projects.length===0?<div className="emptyState"><h3>No hay proyectos todavía.</h3><p>Creá una constructora y después su primer proyecto para comenzar.</p></div>:projects.map(p=><button key={p.id} className={selectedProject?.id===p.id?'platformProjectRow active':'platformProjectRow'} onClick={()=>openProject(p)}><span><b>{p.name}</b><small>{p.slug}</small></span><em>{p.status}</em><strong>Ver →</strong></button>)}
        </article>
        <article className="adminPanel platformLivePanel">
          {!selectedProject||!selectedData?<div className="platformPlaceholder"><span>LIVE PROJECT VIEW</span><h2>Seleccioná un proyecto.</h2><p>La plataforma carga estructura, inventario, media y publicación del proyecto real y lo renderiza en esta misma pantalla.</p></div>:<Suspense fallback={<div className="platformPlaceholder"><h2>Cargando experiencia…</h2></div>}><LivePreview project={selectedData.project} data={selectedData} apiKey="" authHeader="x-platform-key"/></Suspense>}
          {selectedProject&&selectedData?.publication?.isPublished&&<a className="adminPrimary platformOpenPublic" href={`/proyecto/${selectedData.publication.publicSlug}`} target="_blank" rel="noreferrer">Abrir showroom público ↗</a>}
          {selectedProject&&<button className="adminGhost platformClosePreview" onClick={closeProject}>Cerrar vista</button>}
        </article>
      </div>
      <article className="adminPanel platformCompanyStrip"><span className="adminKicker">EMPRESAS</span><div className="companyStrip">{companies.map(c=><div key={c.id}><b>{c.name}</b><span>{c.slug}</span><em>{c.status}</em></div>)}</div></article>
    </main>
  </Shell>
}

export default function AdminPortal({platform=false,sharedToken=null,sharedProject=null}){
if(sharedToken && sharedProject) return <ProjectBuilder project={sharedProject} apiKey={sharedToken} authHeader="x-share-token" onBack={()=>{window.location.href='/';}}/>;const [mode,setMode]=useState(null),[key,setKey]=useState(''),[error,setError]=useState('');const reset=()=>{setMode(null);setKey('');setError('')};if(!mode)return <main className="adminLogin"><div className="loginBox"><span className="adminLogo">RE</span><span className="adminKicker">REALESTATE PLATFORM</span><h1>Control del showroom</h1><p>Elegí el acceso.</p><div className="contentGrid"><button className="adminPrimary" onClick={()=>setMode('tenant')}>Cliente / constructora</button><button className="adminGhost" onClick={()=>setMode('platform')}>Platform Owner</button></div></div></main>;if(!key.trim())return <Login title={mode==='tenant'?'Workspace cliente':'Platform Owner'} subtitle={mode==='tenant'?'Clave de acceso de la constructora.':'Clave maestra de plataforma.'} value={key} setValue={setKey} onSubmit={()=>{if(!key.trim())setError('La clave es obligatoria')}} error={error} onBack={reset}/>;return mode==='tenant'?<TenantPortal apiKey={key} onLogout={reset}/>:<PlatformPortal platformKey={key} onLogout={reset}/>;}
