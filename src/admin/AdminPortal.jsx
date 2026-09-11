import { useEffect, useMemo, useState } from 'react';
import './admin.css';
import AIIntake from './AIIntake';

const API = import.meta.env.VITE_API_BASE_URL || '/api';

async function request(path, options = {}) {
  const response = await fetch(`${API}${path}`, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || `Error ${response.status}`);
  return data;
}

function json(method, body, headers = {}) {
  return {
    method,
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}

function Field({ label, ...props }) {
  return <label className="adminField"><span>{label}</span><input {...props} /></label>;
}

function TextArea({ label, ...props }) {
  return <label className="adminField"><span>{label}</span><textarea {...props} /></label>;
}

function Login({ title, subtitle, fields, onSubmit, error }) {
  return (
    <main className="adminLogin">
      <div className="loginBox">
        <span className="adminLogo">RE</span>
        <span className="adminKicker">REALESTATE PLATFORM</span>
        <h1>{title}</h1>
        <p>{subtitle}</p>
        <form onSubmit={(event) => { event.preventDefault(); onSubmit(); }}>
          {fields.map(([label, value, setValue, type = 'text']) => (
            <Field key={label} label={label} type={type} value={value} onChange={(event) => setValue(event.target.value)} required />
          ))}
          <button className="adminPrimary">Entrar</button>
        </form>
        {error && <div className="adminNotice">{error}</div>}
      </div>
    </main>
  );
}

function Shell({ brand, subtitle, children }) {
  return (
    <div className="adminApp">
      <header className="adminHeader">
        <div><b>RE</b><strong>{brand}</strong><small>{subtitle}</small></div>
        <a href="/">Volver ↗</a>
      </header>
      {children}
    </div>
  );
}

function ProjectWorkspace({ project, apiKey, onRefresh }) {
  const headers = useMemo(() => ({ 'x-api-key': apiKey }), [apiKey]);
  const [tab, setTab] = useState('overview');
  const [data, setData] = useState({ units: [], buildings: [], floors: [], plans: [], amenities: [], assets: [], location: null, publication: null, leads: [] });
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  async function load() {
    const base = `/admin/projects/${project.id}`;
    const [units, buildings, floors, plans, amenities, assets, location, publication, leads] = await Promise.all([
      request(`${base}/units`, { headers }),
      request(`${base}/buildings`, { headers }),
      request(`${base}/floors`, { headers }),
      request(`${base}/plans`, { headers }),
      request(`${base}/amenities`, { headers }),
      request(`${base}/assets`, { headers }),
      request(`${base}/location`, { headers }),
      request(`${base}/publication`, { headers }),
      request(`${base}/leads`, { headers }),
    ]);
    setData({ units, buildings, floors, plans, amenities, assets, location, publication, leads });
  }

  useEffect(() => { load().catch((error) => setMessage(error.message)); }, [project.id]);

  async function act(fn, success = 'Guardado') {
    setSaving(true);
    setMessage('');
    try {
      await fn();
      await load();
      await onRefresh();
      setMessage(success);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  }

  const publish = () => act(() => request(`/admin/projects/${project.id}/publish`, json('POST', { publicSlug: data.publication?.publicSlug || project.slug }, headers)), 'Proyecto publicado');
  const unpublish = () => act(() => request(`/admin/projects/${project.id}/unpublish`, { method: 'POST', headers }), 'Proyecto despublicado');

  return (
    <section className="adminWorkspace">
      <div className="workspaceHead">
        <div><span className="adminKicker">PROJECT WORKSPACE</span><h1>{project.name}</h1><p>{project.slug} · {project.status}</p></div>
        <div className="headActions">
          {data.publication?.isPublished ? <button className="adminGhost" onClick={unpublish} disabled={saving}>Despublicar</button> : <button className="adminPrimary" onClick={publish} disabled={saving}>Publicar showroom ↗</button>}
        </div>
      </div>
      <nav className="workspaceTabs">
        {[
          ['overview', 'Resumen'], ['identity', 'Identidad'], ['structure', 'Edificio'], ['inventory', 'Unidades'],
          ['content', 'Contenido'], ['ai', 'IA'], ['publication', 'Publicación'], ['leads', 'Leads'],
        ].map(([id, label]) => <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>{label}</button>)}
      </nav>
      {tab === 'overview' && <Overview project={project} data={data} />}
      {tab === 'identity' && <Identity project={project} headers={headers} act={act} />}
      {tab === 'structure' && <Structure project={project} data={data} headers={headers} act={act} />}
      {tab === 'inventory' && <Inventory project={project} data={data} headers={headers} act={act} />}
      {tab === 'content' && <Content project={project} data={data} headers={headers} act={act} />}
      {tab === 'ai' && <AIIntake project={project} apiKey={apiKey} act={act} />}
      {tab === 'publication' && <Publication project={project} data={data} headers={headers} act={act} />}
      {tab === 'leads' && <Leads leads={data.leads} />}
      {message && <div className="adminNotice">{message}</div>}
    </section>
  );
}

function Overview({ project, data }) {
  const available = data.units.filter((unit) => unit.status === 'AVAILABLE').length;
  const checks = [
    ['Estructura', data.buildings.length > 0],
    ['Inventario', data.units.length > 0],
    ['Contenido', data.amenities.length + data.assets.length + data.plans.length > 0],
    ['Publicación', Boolean(data.publication?.isPublished)],
  ];
  return (
    <>
      <div className="adminStats">
        <div><strong>{data.units.length}</strong><span>Unidades</span></div>
        <div><strong>{available}</strong><span>Disponibles</span></div>
        <div><strong>{data.buildings.length}</strong><span>Edificios</span></div>
        <div><strong>{data.leads.length}</strong><span>Consultas</span></div>
      </div>
      <div className="overviewGrid">
        <article className="adminPanel">
          <span className="adminKicker">FUENTE DE VERDAD</span>
          <h2>{project.name}</h2>
          <p>{project.description || 'Sin descripción.'}</p>
          <div className="detailList"><span>Estado <b>{project.status}</b></span><span>Ubicación <b>{project.location?.city || 'Sin definir'}</b></span><span>Slug público <b>{data.publication?.publicSlug || 'Sin configurar'}</b></span></div>
        </article>
        <article className="adminPanel">
          <span className="adminKicker">CHECKLIST</span>
          <h2>Operación</h2>
          <div className="checkList">{checks.map(([label, ok]) => <div key={label}><i>{ok ? '✓' : '○'}</i>{label}<small>{ok ? 'Listo' : 'Pendiente'}</small></div>)}</div>
        </article>
      </div>
    </>
  );
}

function Identity({ project, headers, act }) {
  const [form, setForm] = useState({ name: project.name, slug: project.slug, description: project.description || '' });
  return (
    <div className="adminPanel formPanel">
      <span className="adminKicker">IDENTIDAD DEL PROYECTO</span><h2>Marca y presentación</h2>
      <Field label="Nombre" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
      <Field label="Slug interno" value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} />
      <TextArea label="Descripción" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
      <button className="adminPrimary" onClick={() => act(() => request(`/admin/projects/${project.id}`, json('PATCH', form, headers)), 'Identidad guardada')}>Guardar identidad</button>
    </div>
  );
}

function Structure({ project, data, headers, act }) {
  const [building, setBuilding] = useState({ name: '', reference: '' });
  const [floor, setFloor] = useState({ buildingId: data.buildings[0]?.id || '', number: '', name: '' });
  return (
    <div className="contentGrid">
      <article className="adminPanel">
        <span className="adminKicker">EDIFICIOS</span><h2>Estructura vertical</h2>
        {data.buildings.map((item) => <div className="dataRow" key={item.id}><b>{item.name}</b><span>{item.reference || item.id.slice(0, 8)}</span></div>)}
        <div className="formGrid"><Field label="Nombre" placeholder="Tower A" value={building.name} onChange={(event) => setBuilding({ ...building, name: event.target.value })} /><Field label="Referencia" placeholder="tower-a" value={building.reference} onChange={(event) => setBuilding({ ...building, reference: event.target.value })} /></div>
        <button className="adminPrimary" onClick={() => act(() => request(`/admin/projects/${project.id}/buildings`, json('POST', building, headers)), 'Edificio creado')}>+ Agregar edificio</button>
      </article>
      <article className="adminPanel">
        <span className="adminKicker">PISOS</span><h2>Distribución</h2>
        {data.floors.map((item) => <div className="dataRow" key={item.id}><b>Piso {item.number}</b><span>{item.name || 'Sin nombre'}</span></div>)}
        <label className="adminField"><span>Edificio</span><select value={floor.buildingId} onChange={(event) => setFloor({ ...floor, buildingId: event.target.value })}>{data.buildings.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <div className="formGrid"><Field label="Número" type="number" value={floor.number} onChange={(event) => setFloor({ ...floor, number: event.target.value })} /><Field label="Nombre" placeholder="Piso 8" value={floor.name} onChange={(event) => setFloor({ ...floor, name: event.target.value })} /></div>
        <button className="adminPrimary" onClick={() => act(() => request(`/admin/projects/${project.id}/floors`, json('POST', { ...floor, number: Number(floor.number) }, headers)), 'Piso creado')} disabled={!floor.buildingId || floor.number === ''}>+ Agregar piso</button>
      </article>
    </div>
  );
}

function Inventory({ project, data, headers, act }) {
  const [selected, setSelected] = useState(data.units[0] ? { ...data.units[0] } : null);
  const [newUnit, setNewUnit] = useState({ buildingId: data.buildings[0]?.id || '', floorId: data.floors[0]?.id || '', number: '', surface: 0, bedrooms: 0, bathrooms: 0, terrace: 0, price: 0, currency: 'USD', status: 'AVAILABLE', description: '' });
  const update = (key, value) => setSelected((current) => ({ ...current, [key]: value }));
  return (
    <div className="inventoryWorkspace">
      <div className="adminPanel inventoryList">
        <div className="panelTitle"><span>Inventario</span><small>{data.units.length} unidades</small></div>
        {data.units.map((unit) => <button key={unit.id} className={selected?.id === unit.id ? 'active' : ''} onClick={() => setSelected({ ...unit })}><b>{unit.number}</b><span>{unit.surface || 0} m²</span><em>{unit.status}</em><strong>{unit.currency} {Number(unit.price || 0).toLocaleString('en-US')}</strong></button>)}
        <button className="sidebarNew" onClick={() => setSelected(null)}>+ Nueva unidad</button>
      </div>
      <div className="adminPanel">
        {selected ? (
          <>
            <div className="panelTitle"><span>Unidad {selected.number}</span><small>Fuente comercial</small></div>
            <div className="formGrid">
              {['number', 'surface', 'bedrooms', 'bathrooms', 'terrace', 'price'].map((key) => <Field key={key} label={key} type={key === 'number' ? 'text' : 'number'} value={selected[key] ?? ''} onChange={(event) => update(key, event.target.value)} />)}
              <label className="adminField"><span>Estado</span><select value={selected.status} onChange={(event) => update('status', event.target.value)}><option>AVAILABLE</option><option>RESERVED</option><option>SOLD</option><option>HIDDEN</option></select></label>
              <label className="adminField"><span>Moneda</span><select value={selected.currency || 'USD'} onChange={(event) => update('currency', event.target.value)}><option>USD</option><option>UYU</option><option>ARS</option><option>EUR</option></select></label>
            </div>
            <TextArea label="Descripción" value={selected.description || ''} onChange={(event) => update('description', event.target.value)} />
            <button className="adminPrimary" onClick={() => act(() => request(`/admin/projects/${project.id}/units/${selected.id}`, json('PATCH', selected, headers)), 'Unidad actualizada')}>Guardar unidad</button>
          </>
        ) : (
          <>
            <span className="adminKicker">NUEVA UNIDAD</span><h2>Agregar inventario</h2>
            <div className="formGrid"><Field label="Número" value={newUnit.number} onChange={(event) => setNewUnit({ ...newUnit, number: event.target.value })} /><Field label="Superficie" type="number" value={newUnit.surface} onChange={(event) => setNewUnit({ ...newUnit, surface: event.target.value })} /><Field label="Dormitorios" type="number" value={newUnit.bedrooms} onChange={(event) => setNewUnit({ ...newUnit, bedrooms: event.target.value })} /><Field label="Baños" type="number" value={newUnit.bathrooms} onChange={(event) => setNewUnit({ ...newUnit, bathrooms: event.target.value })} /><Field label="Precio" type="number" value={newUnit.price} onChange={(event) => setNewUnit({ ...newUnit, price: event.target.value })} /></div>
            <label className="adminField"><span>Edificio</span><select value={newUnit.buildingId} onChange={(event) => setNewUnit({ ...newUnit, buildingId: event.target.value })}>{data.buildings.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
            <label className="adminField"><span>Piso</span><select value={newUnit.floorId} onChange={(event) => setNewUnit({ ...newUnit, floorId: event.target.value })}>{data.floors.map((item) => <option key={item.id} value={item.id}>Piso {item.number}</option>)}</select></label>
            <button className="adminPrimary" onClick={() => act(() => request(`/admin/projects/${project.id}/units`, json('POST', newUnit, headers)), 'Unidad creada')} disabled={!newUnit.number || !newUnit.buildingId || !newUnit.floorId}>Crear unidad</button>
          </>
        )}
      </div>
    </div>
  );
}

function Content({ project, data, headers, act }) {
  const [amenity, setAmenity] = useState({ name: '', description: '', category: 'common' });
  const [asset, setAsset] = useState({ name: '', kind: 'image', url: '', path: '' });
  const [plan, setPlan] = useState({ name: '', kind: 'architectural', filePath: '', description: '' });
  return (
    <div className="contentGrid">
      <article className="adminPanel"><span className="adminKicker">AMENITIES</span><h2>Amenities</h2>{data.amenities.map((item) => <div className="dataRow" key={item.id}><b>{item.name}</b><span>{item.category}</span></div>)}<Field label="Nombre" value={amenity.name} onChange={(event) => setAmenity({ ...amenity, name: event.target.value })} /><TextArea label="Descripción" value={amenity.description} onChange={(event) => setAmenity({ ...amenity, description: event.target.value })} /><button className="adminPrimary" onClick={() => act(() => request(`/admin/projects/${project.id}/amenities`, json('POST', amenity, headers)), 'Amenity agregado')}>+ Agregar amenity</button></article>
      <article className="adminPanel"><span className="adminKicker">MEDIA & PLANOS</span><h2>Contenido visual</h2>{data.assets.map((item) => <div className="dataRow" key={item.id}><b>{item.name}</b><span>{item.kind}</span></div>)}{data.plans.map((item) => <div className="dataRow" key={item.id}><b>{item.name}</b><span>{item.kind}</span></div>)}<Field label="Nombre del asset" value={asset.name} onChange={(event) => setAsset({ ...asset, name: event.target.value })} /><Field label="URL" value={asset.url} onChange={(event) => setAsset({ ...asset, url: event.target.value })} /><button className="adminGhost" onClick={() => act(() => request(`/admin/projects/${project.id}/assets`, json('POST', asset, headers)), 'Asset agregado')}>+ Agregar media</button><div className="divider" /><Field label="Nombre del plano" value={plan.name} onChange={(event) => setPlan({ ...plan, name: event.target.value })} /><Field label="Archivo / URL" value={plan.filePath} onChange={(event) => setPlan({ ...plan, filePath: event.target.value })} /><button className="adminGhost" onClick={() => act(() => request(`/admin/projects/${project.id}/plans`, json('POST', plan, headers)), 'Plano agregado')}>+ Agregar plano</button></article>
    </div>
  );
}

function Publication({ project, data, headers, act }) {
  const [form, setForm] = useState({ publicSlug: data.publication?.publicSlug || project.slug, title: data.publication?.title || project.name, description: data.publication?.description || '', thumbnail: data.publication?.thumbnail || '', buttonText: data.publication?.buttonText || 'Explorar en 3D' });
  const save = () => act(() => data.publication ? request(`/admin/projects/${project.id}/publication`, json('PATCH', form, headers)) : request(`/admin/projects/${project.id}/publication`, json('POST', form, headers)), 'Publicación guardada');
  return <div className="adminPanel formPanel"><span className="adminKicker">PUBLICACIÓN</span><h2>Showroom público</h2><Field label="Slug público" value={form.publicSlug} onChange={(event) => setForm({ ...form, publicSlug: event.target.value })} /><Field label="Título" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /><TextArea label="Descripción" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /><Field label="Thumbnail URL" value={form.thumbnail} onChange={(event) => setForm({ ...form, thumbnail: event.target.value })} /><button className="adminPrimary" onClick={save}>Guardar publicación</button>{data.publication?.isPublished && <p><a href={`/proyecto/${data.publication.publicSlug}`}>Abrir showroom ↗</a></p>}</div>;
}

function Leads({ leads }) {
  return <div className="adminPanel"><span className="adminKicker">LEADS</span><h2>Consultas recibidas</h2>{leads.length === 0 ? <p>No hay consultas todavía.</p> : leads.map((lead) => <div className="dataRow" key={lead.id}><b>{lead.name}</b><span>{lead.email}{lead.phone ? ` · ${lead.phone}` : ''}</span><em>{lead.message || 'Sin mensaje'}</em></div>)}</div>;
}

function TenantPortal({ apiKey }) {
  const [company, setCompany] = useState(null);
  const [projects, setProjects] = useState([]);
  const [selected, setSelected] = useState(null);
  const [newProject, setNewProject] = useState({ name: '', slug: '', description: '' });
  const [error, setError] = useState('');
  const headers = useMemo(() => ({ 'x-api-key': apiKey }), [apiKey]);

  async function load() {
    const [me, list] = await Promise.all([request('/admin/me', { headers }), request('/admin/companies/' + 'current/projects', { headers }).catch(() => request('/admin/projects', { headers }))]);
    setCompany(me);
    setProjects(Array.isArray(list) ? list : []);
  }

  useEffect(() => { load().catch((err) => setError(err.message)); }, [apiKey]);

  async function createProject(event) {
    event.preventDefault();
    try {
      const project = await request('/admin/projects', json('POST', newProject, headers));
      setNewProject({ name: '', slug: '', description: '' });
      await load();
      setSelected(project);
    } catch (err) { setError(err.message); }
  }

  if (selected) return <Shell brand={company?.name || 'Cliente'} subtitle="Workspace"><button className="adminBack" onClick={() => setSelected(null)}>← Proyectos</button><ProjectWorkspace project={selected} apiKey={apiKey} onRefresh={load} /></Shell>;

  return (
    <Shell brand={company?.name || 'Cliente'} subtitle="Workspace de proyectos">
      <main className="adminMain">
        <div className="workspaceHead"><div><span className="adminKicker">CLIENT WORKSPACE</span><h1>Proyectos</h1><p>Gestioná proyectos, inventario, contenido y publicación.</p></div></div>
        {error && <div className="adminNotice">{error}</div>}
        <div className="contentGrid">
          <article className="adminPanel"><span className="adminKicker">NUEVO PROYECTO</span><h2>Crear showroom</h2><form onSubmit={createProject}><Field label="Nombre" value={newProject.name} onChange={(event) => setNewProject({ ...newProject, name: event.target.value })} required /><Field label="Slug" value={newProject.slug} onChange={(event) => setNewProject({ ...newProject, slug: event.target.value })} /><TextArea label="Descripción" value={newProject.description} onChange={(event) => setNewProject({ ...newProject, description: event.target.value })} /><button className="adminPrimary">Crear proyecto</button></form></article>
          <article className="adminPanel"><span className="adminKicker">MIS PROYECTOS</span><h2>{projects.length} proyectos</h2>{projects.map((project) => <button className="projectCard" key={project.id} onClick={() => setSelected(project)}><b>{project.name}</b><span>{project.slug}</span><em>{project.status}</em></button>)}</article>
        </div>
      </main>
    </Shell>
  );
}

function PlatformPortal({ platformKey }) {
  const [companies, setCompanies] = useState([]);
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState('');
  const headers = useMemo(() => ({ 'x-platform-key': platformKey }), [platformKey]);
  useEffect(() => { Promise.all([request('/admin/companies', { headers }), request('/platform/companies', { headers }).catch(() => [])]).then(([list, fallback]) => { setCompanies(Array.isArray(list) ? list : []); setProjects(Array.isArray(fallback) ? fallback : []); }).catch((err) => setError(err.message)); }, [platformKey]);
  return <Shell brand="Platform Owner" subtitle="Control central"><main className="adminMain"><div className="workspaceHead"><div><span className="adminKicker">PLATFORM CONTROL</span><h1>Operación</h1><p>Empresas y proyectos bajo control de la plataforma.</p></div></div>{error && <div className="adminNotice">{error}</div>}<div className="adminStats"><div><strong>{companies.length}</strong><span>Empresas</span></div><div><strong>{projects.length}</strong><span>Proyectos consultados</span></div></div><div className="contentGrid"><article className="adminPanel"><span className="adminKicker">TENANTS</span><h2>Empresas</h2>{companies.map((company) => <div className="dataRow" key={company.id}><b>{company.name}</b><span>{company.slug}</span><em>{company.status}</em></div>)}</article><article className="adminPanel"><span className="adminKicker">PROYECTOS</span><h2>Inventario global</h2>{projects.map((project) => <div className="dataRow" key={project.id}><b>{project.name}</b><span>{project.slug}</span><em>{project.status}</em></div>)}</article></div></main></Shell>;
}

export default function AdminPortal() {
  const [mode, setMode] = useState(null);
  const [key, setKey] = useState('');
  const [error, setError] = useState('');
  if (!mode) return <main className="adminLogin"><div className="loginBox"><span className="adminLogo">RE</span><span className="adminKicker">REALESTATE PLATFORM</span><h1>Control del showroom</h1><p>Elegí el acceso correspondiente.</p><div className="contentGrid"><button className="adminPrimary" onClick={() => setMode('tenant')}>Cliente / constructora</button><button className="adminGhost" onClick={() => setMode('platform')}>Platform Owner</button></div></div></main>;
  if (mode === 'tenant') {
    if (key.trim() && error === '') return <TenantPortal apiKey={key} />;
    return <Login title="Workspace cliente" subtitle="Ingresá la API key de la empresa." fields={[["API key", key, setKey, 'password']]} onSubmit={() => { setError(''); if (!key.trim()) return setError('La API key es obligatoria.'); }} error={error} />;
  }
  if (key.trim() && error === '') return <PlatformPortal platformKey={key} />;
  return <Login title="Platform Owner" subtitle="Ingresá la clave maestra de plataforma." fields={[["Platform key", key, setKey, 'password']]} onSubmit={() => { setError(''); if (!key.trim()) return setError('La platform key es obligatoria.'); }} error={error} />;
}
