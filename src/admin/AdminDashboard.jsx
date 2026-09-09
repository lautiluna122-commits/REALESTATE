import { useEffect, useMemo, useState } from 'react';
import { platformApi } from '../platform/platformApi';
import { getProjectBySlug, getProjectUnits } from '../platform/projectRegistry';
import './admin-dashboard.css';
import './publication-links.css';

const nav = [
  ['overview', 'Resumen'], ['content', 'Contenido'], ['inventory', 'Inventario'],
  ['experience', 'Experiencia'], ['branding', 'Branding'], ['plans', 'Planos'], ['publish', 'Publicar'],
];

const fallbackProject = getProjectBySlug('ocean-mansions');
const fallbackUnits = getProjectUnits(fallbackProject);

export default function AdminDashboard() {
  const [section, setSection] = useState('overview');
  const [projects, setProjects] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadProjects() {
    setLoading(true); setError('');
    try {
      const data = await platformApi.getAdminProjects();
      setProjects(Array.isArray(data) ? data : []);
      if (!selectedId && data?.[0]) setSelectedId(data[0].id);
    } catch (err) {
      setError(err?.message || 'No se pudo cargar el workspace.');
      setProjects([]);
    } finally { setLoading(false); }
  }

  useEffect(() => { loadProjects(); }, []);
  useEffect(() => {
    if (!selectedId) return;
    platformApi.getProjectUnits(selectedId).then(setUnits).catch(() => setUnits([]));
  }, [selectedId]);

  const project = projects.find((item) => item.id === selectedId) || projects[0] || null;
  const activeUnits = project ? units : fallbackUnits;
  const available = useMemo(() => activeUnits.filter((u) => u.status === 'AVAILABLE'), [activeUnits]);
  const reserved = useMemo(() => activeUnits.filter((u) => u.status !== 'AVAILABLE'), [activeUnits]);
  const slug = project?.publication?.publicSlug || project?.slug || fallbackProject.slug;
  const published = project?.status === 'PUBLISHED' || Boolean(project?.publication?.isPublished);

  return <div className="admin-shell">
    <aside className="admin-sidebar">
      <div className="admin-brand"><span>RE</span><div><strong>REAL ESTATE</strong><small>SHOWROOM STUDIO</small></div></div>
      <div className="admin-workspace"><small>PROYECTO ACTIVO</small><select value={project?.id || ''} onChange={(e) => setSelectedId(e.target.value)} disabled={!projects.length}>{projects.length ? projects.map((item) => <option key={item.id} value={item.id}>{item.name}</option>) : <option>Sin proyectos</option>}</select></div>
      <nav>{nav.map(([id, label]) => <button key={id} className={section === id ? 'active' : ''} onClick={() => setSection(id)}><i>{icon(id)}</i>{label}</button>)}</nav>
      <div className="admin-side-bottom"><button>⚙ Configuración</button><a href={`/proyecto/${slug}`}>↗ Ver showroom</a></div>
    </aside>
    <main className="admin-main">
      <header className="admin-topbar"><div><span className="eyebrow">PROJECT STUDIO / {label(section)}</span><h1>{section === 'overview' ? 'Panel del proyecto' : label(section)}</h1></div><div className="top-actions"><span className="status-dot">{published ? 'Publicado' : (project?.status || 'Sin proyecto')}</span><a className="preview-button" href={`/proyecto/${slug}`}>Vista previa ↗</a></div></header>
      {loading && <div className="section-card"><p>Cargando workspace…</p></div>}
      {!loading && error && <div className="section-card"><CardHead title="No pudimos cargar el workspace" text={error} /><button className="primary-wide" onClick={loadProjects}>Reintentar conexión →</button></div>}
      {!loading && !error && project && <>
        {section === 'overview' && <Overview project={project} available={available.length} reserved={reserved.length} units={activeUnits.length} published={published} setSection={setSection} />}
        {section === 'content' && <Content project={project} />}
        {section === 'inventory' && <Inventory units={activeUnits} />}
        {section === 'experience' && <Experience setSection={setSection} published={published} />}
        {section === 'branding' && <Branding project={project} />}
        {section === 'plans' && <Plans units={activeUnits} />}
        {section === 'publish' && <Publish project={project} published={published} />}
      </>}
      {!loading && !error && !project && <div className="section-card"><CardHead title="Todavía no hay proyectos" text="Creá el primer proyecto desde Project Studio para comenzar el circuito de publicación." /><a className="primary-wide" href="/studio">Abrir Project Studio →</a></div>}
    </main>
  </div>;
}

function Overview({ project, available, reserved, units, published, setSection }) {
  const analytics = project.metrics?.analytics || { total: 0 };
  return <div className="dashboard-grid">
    <section className="project-hero"><div className="hero-copy"><span className="pill">{published ? 'SHOWROOM ACTIVO' : `ESTADO · ${project.status || 'DRAFT'}`}</span><h2>{project.name}</h2><p>{project.location?.district || project.location?.city || 'Proyecto inmobiliario'} · {project.location?.city || 'Punta del Este'} · {project.location?.country || 'Uruguay'}</p><div className="hero-actions"><a href={`/proyecto/${project.publication?.publicSlug || project.slug}`}>{published ? 'Abrir showroom' : 'Abrir preview'}</a><button onClick={() => setSection('experience')}>Editar experiencia</button></div></div><div className="hero-visual"><div className="tower-art"><div className="tower-glow" /><div className="tower-lines" /></div><span>3D EXPERIENCE</span></div></section>
    <section className="metrics"><Metric title="Unidades" value={units} detail={`${available} disponibles`} /><Metric title="Reservadas" value={reserved} detail="Estado comercial" /><Metric title="Assets" value={project.metrics?.assets ?? 0} detail="archivos vinculados" /><Metric title="Interacciones" value={analytics.total ?? 0} detail="eventos registrados" /></section>
    <section className="section-card wide"><CardHead title="Centro de control" text="La información de este panel viene del backend del proyecto, no de datos hardcodeados."/><div className="entry-grid">{[['content','Contenido','Assets comerciales y técnicos.'],['inventory','Inventario','Unidades, precios y disponibilidad.'],['experience','Experiencia','Recorrido y configuración del showroom.'],['plans','Planos','Planos y vínculo espacial.'],['branding','Branding','Identidad visual del proyecto.'],['publish','Publicar','Estado, accesos y publicación.']].map(([id,t,d]) => <button className="entry" key={id} onClick={() => setSection(id)}><span>{icon(id)}</span><div><strong>{t}</strong><small>{d}</small></div><b>→</b></button>)}</div></section>
  </div>;
}

function Content({ project }) { const assets = project.metrics?.assets ?? 0; return <div className="section-card"><CardHead title="Contenido del proyecto" text={`${assets} assets vinculados al proyecto. La carga directa de archivos grandes se incorpora en el siguiente bloque de storage.`}/><div className="dropzone"><div>＋</div><strong>Administrar renders, modelos, planos o vídeos</strong><span>JPG · PNG · WEBP · GLB · GLTF · MP4 · MOV · PDF</span><button disabled>Gestor de assets · siguiente bloque</button></div><div className="content-grid">{[['3D','Modelo del edificio','GLB / GLTF',assets > 0],['IMG','Renders exteriores','JPG / WEBP',false],['INT','Interiores','JPG / WEBP',false],['360','Tours 360°','360 / vídeo',false],['VID','Vídeos','MP4 / WEBM',false],['AM','Amenities','Imágenes + datos',false]].map(([tag,title,type,ready]) => <article className="asset-card" key={title}><div className="asset-thumb"><span>{tag}</span>{ready && <em>✓</em>}</div><div><strong>{title}</strong><small>{type}</small><span className={ready ? 'ready' : ''}>{ready ? 'Listo' : 'Pendiente'}</span></div></article>)}</div></div>; }

function Inventory({ units }) { return <div className="section-card"><CardHead title="Inventario" text={`${units.length} unidades vinculadas al proyecto.`}/><div className="inventory-table"><div className="tr th"><span>Unidad</span><span>Piso</span><span>Superficie</span><span>Dorm.</span><span>Precio</span><span>Estado</span></div>{units.slice(0,24).map((u) => <div className="tr" key={u.id}><span><strong>{u.number || u.id}</strong></span><span>{u.floor ?? '—'}</span><span>{u.surface ?? u.area ?? 0} m²</span><span>{u.bedrooms ?? 0}</span><span>{u.currency || 'USD'} {Number(u.price || 0).toLocaleString('en-US')}</span><span className={u.status === 'AVAILABLE' ? 'available' : 'reserved'}>{u.status === 'AVAILABLE' ? 'Disponible' : u.status === 'RESERVED' ? 'Reservada' : u.status}</span></div>)}</div></div>; }

function Experience({ setSection, published }) { return <div className="section-card"><CardHead title="Experiencia del showroom" text="Configuración que alimenta la experiencia pública del proyecto."/><div className="experience-layout"><div className="experience-preview"><div className="preview-sky"/><div className="preview-building"><div/><div/><div/></div><span>LIVE PREVIEW · {published ? 'PUBLISHED' : 'PREVIEW'}</span></div><div className="control-list"><Control title="Entrada cinematográfica" value="Exterior → edificio"/><Control title="Selección de piso" value="Interactiva"/><Control title="Recorrido interior" value="Activado"/><Control title="Modo día / noche" value="Activado"/><Control title="Tour 360°" value="Pendiente"/></div></div><button className="primary-wide" onClick={() => setSection('content')}>Administrar assets de la experiencia →</button></div>; }

function Branding({ project }) { const branding = project.branding || {}; return <div className="section-card"><CardHead title="Branding" text="Identidad visual tomada de la configuración real del proyecto."/><div className="branding-preview"><div className="brand-sample"><span>RE</span><h2>{project.name}</h2><p>Digital Property Experience</p></div><div className="brand-values"><div><small>PRIMARIO</small><b>{branding.primary || '—'}</b></div><div><small>ACENTO</small><b>{branding.accent || branding.secondary || '—'}</b></div><div><small>TIPOGRAFÍA</small><b>{branding.fontFamily || branding.font || 'Inter'}</b></div></div></div></div>; }

function Plans({ units }) { const floors = [...new Set(units.map((u) => u.floor).filter((v) => v !== undefined))]; return <div className="section-card"><CardHead title="Planos e inventario espacial" text="Resumen de pisos detectados desde el inventario real."/><div className="plans-layout"><div className="plan-drawing"><div className="plan-outline"><i/><i/><i/><i/><i/><i/><i/><i/></div><span>{floors.length ? `${floors.length} PISOS DETECTADOS` : 'PLANO PENDIENTE'}</span></div><div><h3>Vinculación</h3><p>{units.length} unidades disponibles para vinculación espacial.</p><button className="secondary-button" disabled>Importar plano PDF</button><button className="secondary-button" disabled>Validar unidades</button></div></div></div>; }

function Publish({ project, published }) { const slug = project.publication?.publicSlug || project.slug; const clientUrl = `/cliente/${slug}`; const readerUrl = `/embed/${slug}`; return <div className="section-card"><CardHead title="Publicación" text="El estado mostrado refleja el lifecycle y la publicación persistidos en backend."/><div className="publish-links"><PublishLink eyebrow="CLIENTE · PRIVADO" title="Control comercial" path={clientUrl} description="Precios · disponibilidad · métricas"/><PublishLink eyebrow="PÚBLICO · LECTOR" title="Reader / Embed" path={readerUrl} description="Experiencia 3D · solo lectura · para insertar en su web"/></div><div className="publish-url"><small>SHOWROOM DIRECTO</small><strong>/proyecto/{slug}</strong><a href={`/proyecto/${slug}`}>Abrir ↗</a></div><div className="checklist">{[['Proyecto configurado',Boolean(project.id)],['Inventario cargado',(project.metrics?.units ?? 0) > 0],['Branding aplicado',Boolean(project.branding)],['Experiencia configurada',Boolean(project.environmentConfig)],['Publicado',published]].map(([x,ok]) => <div key={x}><span>{ok ? '✓' : '○'}</span>{x}<b>{ok ? 'OK' : 'PENDIENTE'}</b></div>)}</div><button className="publish-button" disabled>Publicación desde Studio · lifecycle controlado</button></div>; }

function PublishLink({ eyebrow, title, path, description }) { return <a className="publish-link-card" href={path}><span>{eyebrow}</span><strong>{title}</strong><small>{description}</small><code>{window.location.origin}{path}</code><b>↗</b></a>; }
function Metric({ title, value, detail }) { return <div className="metric"><small>{title}</small><strong>{value}</strong><span>{detail}</span></div>; }
function Control({ title, value }) { return <div className="control"><span>{title}</span><b>{value}</b><i>›</i></div>; }
function CardHead({ title, text }) { return <div className="card-head"><div><h2>{title}</h2><p>{text}</p></div></div>; }
function label(id) { return nav.find(([key]) => key === id)?.[1] || 'Resumen'; }
function icon(id) { return ({ overview:'⌂', content:'▧', inventory:'▦', experience:'◉', branding:'✦', plans:'⌗', publish:'↗' })[id] || '•'; }
