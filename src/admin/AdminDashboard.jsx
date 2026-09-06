import { useMemo, useState } from 'react';
import { getProjectBySlug, getProjectUnits } from '../platform/projectRegistry';
import './admin-dashboard.css';

const project = getProjectBySlug('ocean-mansions');
const units = getProjectUnits(project);

const nav = [
  ['overview', 'Resumen'],
  ['content', 'Contenido'],
  ['inventory', 'Inventario'],
  ['experience', 'Experiencia'],
  ['branding', 'Branding'],
  ['plans', 'Planos'],
  ['publish', 'Publicar'],
];

const contentCards = [
  ['3D', 'Modelo del edificio', 'GLB / GLTF', 'Listo', true],
  ['IMG', 'Renders exteriores', 'JPG / WEBP', 'Agregar renders', false],
  ['INT', 'Interiores', 'JPG / WEBP', 'Agregar interiores', false],
  ['360', 'Tours 360°', '360 / vídeo', 'Agregar tour', false],
  ['VID', 'Vídeos', 'MP4 / WEBM', 'Agregar vídeo', false],
  ['AM', 'Amenities', 'Imágenes + datos', 'Editar amenities', true],
];

export default function AdminDashboard() {
  const [section, setSection] = useState('overview');
  const [projectOpen, setProjectOpen] = useState(true);
  const available = useMemo(() => units.filter((u) => u.status === 'AVAILABLE'), []);
  const reserved = useMemo(() => units.filter((u) => u.status !== 'AVAILABLE'), []);

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand"><span>RE</span><div><strong>REAL ESTATE</strong><small>SHOWROOM STUDIO</small></div></div>
        <div className="admin-workspace"><small>PROYECTO ACTIVO</small><button onClick={() => setProjectOpen(!projectOpen)}>{project.name}<span>⌄</span></button></div>
        <nav>{nav.map(([id, label]) => <button key={id} className={section === id ? 'active' : ''} onClick={() => setSection(id)}><i>{icon(id)}</i>{label}</button>)}</nav>
        <div className="admin-side-bottom"><button>⚙ Configuración</button><a href="/proyecto/ocean-mansions">↗ Ver showroom</a></div>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar"><div><span className="eyebrow">PROJECT STUDIO / {label(section)}</span><h1>{section === 'overview' ? 'Panel del proyecto' : label(section)}</h1></div><div className="top-actions"><span className="status-dot">Publicado</span><a className="preview-button" href="/proyecto/ocean-mansions">Vista previa ↗</a></div></header>

        {section === 'overview' && <Overview available={available.length} reserved={reserved.length} units={units.length} setSection={setSection} />}
        {section === 'content' && <Content />}
        {section === 'inventory' && <Inventory units={units} />}
        {section === 'experience' && <Experience setSection={setSection} />}
        {section === 'branding' && <Branding />}
        {section === 'plans' && <Plans units={units} />}
        {section === 'publish' && <Publish />}
      </main>
    </div>
  );
}

function Overview({ available, reserved, units, setSection }) {
  return <div className="dashboard-grid">
    <section className="project-hero">
      <div className="hero-copy"><span className="pill">SHOWROOM ACTIVO</span><h2>Ocean Mansions</h2><p>Playa Mansa · Punta del Este · Uruguay</p><div className="hero-actions"><a href="/proyecto/ocean-mansions">Abrir showroom</a><button onClick={() => setSection('experience')}>Editar experiencia</button></div></div>
      <div className="hero-visual"><div className="tower-art"><div className="tower-glow" /><div className="tower-lines" /></div><span>3D EXPERIENCE</span></div>
    </section>
    <section className="metrics"><Metric title="Unidades" value={units} detail={`${available} disponibles`} /><Metric title="Reservadas" value={reserved} detail="Estado comercial" /><Metric title="Contenido" value="68%" detail="del proyecto listo" /><Metric title="Experiencia" value="92%" detail="configurada" /></section>
    <section className="section-card wide"><CardHead title="Centro de control" text="Todo lo que necesitás para preparar y publicar un showroom." /><div className="entry-grid">{[['content','Contenido','Renders, modelo 3D, interiores, vídeos y amenities.'],['inventory','Inventario','Unidades, precios, superficie y disponibilidad.'],['experience','Experiencia','Cámara, navegación, transiciones y recorrido.'],['plans','Planos','Planos por piso y vinculación de unidades.'],['branding','Branding','Logo, tipografía, colores y estilo visual.'],['publish','Publicar','Checklist, URL pública y estado del proyecto.']].map(([id,t,d]) => <button className="entry" key={id} onClick={() => setSection(id)}><span>{icon(id)}</span><div><strong>{t}</strong><small>{d}</small></div><b>→</b></button>)}</div></section>
  </div>;
}

function Content() { return <div className="section-card"><CardHead title="Contenido del proyecto" text="Acá se cargan los assets de cada constructora. La siguiente capa conecta este catálogo con storage persistente." /><div className="dropzone"><div>＋</div><strong>Arrastrá renders, modelos, planos o vídeos</strong><span>JPG · PNG · WEBP · GLB · GLTF · MP4 · MOV · PDF</span><button>Seleccionar archivos</button></div><div className="content-grid">{contentCards.map(([tag,title,type,state,ready]) => <article className="asset-card" key={title}><div className="asset-thumb"><span>{tag}</span>{ready && <em>✓</em>}</div><div><strong>{title}</strong><small>{type}</small><span className={ready ? 'ready' : ''}>{state}</span></div></article>)}</div></div> }

function Inventory({ units }) { return <div className="section-card"><CardHead title="Inventario" text={`${units.length} unidades vinculadas al proyecto.`} /><div className="inventory-table"><div className="tr th"><span>Unidad</span><span>Piso</span><span>Superficie</span><span>Dorm.</span><span>Precio</span><span>Estado</span></div>{units.slice(0, 16).map((u) => <div className="tr" key={u.id}><span><strong>{u.number || u.id}</strong></span><span>{u.floor}</span><span>{u.area} m²</span><span>{u.bedrooms}</span><span>USD {Number(u.price).toLocaleString('en-US')}</span><span className={u.status === 'AVAILABLE' ? 'available' : 'reserved'}>{u.status === 'AVAILABLE' ? 'Disponible' : 'Reservada'}</span></div>)}</div></div> }

function Experience({ setSection }) { return <div className="section-card"><CardHead title="Experiencia del showroom" text="Configuración de la experiencia visual que ve el comprador." /><div className="experience-layout"><div className="experience-preview"><div className="preview-sky"/><div className="preview-building"><div/><div/><div/></div><span>LIVE PREVIEW</span></div><div className="control-list"><Control title="Entrada cinematográfica" value="Exterior → edificio" /><Control title="Selección de piso" value="Interactiva" /><Control title="Recorrido interior" value="Activado" /><Control title="Modo día / noche" value="Activado" /><Control title="Tour 360°" value="Pendiente" /></div></div><button className="primary-wide" onClick={() => setSection('content')}>Administrar assets de la experiencia →</button></div> }

function Branding() { return <div className="section-card"><CardHead title="Branding" text="Identidad visual aplicada automáticamente al showroom." /><div className="branding-preview"><div className="brand-sample"><span>OM</span><h2>Ocean Mansions</h2><p>Digital Property Experience</p></div><div className="brand-values"><div><small>PRIMARIO</small><b>#173B63</b></div><div><small>ACENTO</small><b>#D4AF69</b></div><div><small>TIPOGRAFÍA</small><b>Inter</b></div></div></div></div> }

function Plans({ units }) { return <div className="section-card"><CardHead title="Planos e inventario espacial" text="Cada piso puede vincular sus unidades al plano para alimentar la experiencia 3D." /><div className="plans-layout"><div className="plan-drawing"><div className="plan-outline"><i/><i/><i/><i/><i/><i/><i/><i/></div><span>PLANO · PISO 5</span></div><div><h3>Vinculación</h3><p>{units.filter((u) => u.floor === 5).length} unidades detectadas en piso 5.</p><button className="secondary-button">Importar plano PDF</button><button className="secondary-button">Validar unidades</button></div></div></div> }

function Publish() { return <div className="section-card"><CardHead title="Publicación" text="Estado del showroom y checklist previo a compartirlo con una constructora." /><div className="publish-url"><small>URL PÚBLICA</small><strong>/proyecto/ocean-mansions</strong><a href="/proyecto/ocean-mansions">Abrir ↗</a></div><div className="checklist">{['Proyecto configurado','Inventario cargado','Branding aplicado','Experiencia configurada','Ruta pública preparada'].map((x) => <div key={x}><span>✓</span>{x}<b>OK</b></div>)}</div><button className="publish-button">Publicar cambios</button></div> }

function Metric({ title, value, detail }) { return <div className="metric"><small>{title}</small><strong>{value}</strong><span>{detail}</span></div> }
function Control({ title, value }) { return <div className="control"><span>{title}</span><b>{value}</b><i>›</i></div> }
function CardHead({ title, text }) { return <div className="card-head"><div><h2>{title}</h2><p>{text}</p></div></div> }
function label(id) { return nav.find(([key]) => key === id)?.[1] || 'Resumen'; }
function icon(id) { return ({overview:'⌂',content:'▧',inventory:'▦',experience:'◉',branding:'✦',plans:'⌗',publish:'↗'})[id] || '•'; }
