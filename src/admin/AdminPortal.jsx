import { useEffect, useMemo, useState } from 'react';
import './admin.css';

const API = import.meta.env.VITE_API_BASE_URL || '/api';
const getJson = async (url, options = {}) => {
  const response = await fetch(`${API}${url}`, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'No se pudo completar la operación');
  return data;
};

function Field({ label, ...props }) {
  return <label className="adminField"><span>{label}</span><input {...props} /></label>;
}

function ProjectEditor({ project, apiKey, onRefresh }) {
  const [units, setUnits] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [selected, setSelected] = useState(null);
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const headers = { 'x-api-key': apiKey };

  const load = async () => {
    const [u, b] = await Promise.all([
      getJson(`/admin/projects/${project.id}/units`, { headers }),
      getJson(`/admin/projects/${project.id}/buildings`, { headers }),
    ]);
    setUnits(u); setBuildings(b);
  };
  useEffect(() => { load().catch((e) => setStatus(e.message)); }, [project.id]);

  const saveUnit = async (event) => {
    event.preventDefault();
    if (!selected) return;
    setSaving(true); setStatus('');
    try {
      await getJson(`/admin/projects/${project.id}/units/${selected.id}`, {
        method: 'PATCH', headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ number: selected.number, surface: Number(selected.surface), bedrooms: Number(selected.bedrooms), bathrooms: Number(selected.bathrooms), terrace: Number(selected.terrace), price: Number(selected.price), currency: selected.currency, status: selected.status, description: selected.description }),
      });
      setStatus('Unidad guardada'); await load();
    } catch (e) { setStatus(e.message); } finally { setSaving(false); }
  };

  const publish = async () => {
    setSaving(true); setStatus('');
    try { await getJson(`/admin/projects/${project.id}/publish`, { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ publicSlug: project.publicSlug || project.slug }) }); setStatus('Proyecto publicado'); await onRefresh(); }
    catch (e) { setStatus(e.message); } finally { setSaving(false); }
  };

  return <section className="adminWorkspace">
    <div className="adminWorkspaceHead"><div><span className="adminKicker">PROYECTO</span><h2>{project.name}</h2><p>{project.location?.city || 'Sin ubicación'} · {project.status || 'DRAFT'}</p></div><button className="adminPrimary" onClick={publish} disabled={saving}>Publicar proyecto</button></div>
    <div className="adminStats"><div><strong>{units.length}</strong><span>Unidades</span></div><div><strong>{units.filter((u) => u.status === 'AVAILABLE').length}</strong><span>Disponibles</span></div><div><strong>{units.filter((u) => u.status === 'RESERVED').length}</strong><span>Reservadas</span></div><div><strong>{buildings.length}</strong><span>Edificios</span></div></div>
    <div className="adminGrid">
      <div className="adminPanel"><div className="panelTitle"><span>Inventario</span><small>{units.length} unidades</small></div><div className="inventoryRows">{units.map((unit) => <button key={unit.id} className={selected?.id === unit.id ? 'active' : ''} onClick={() => setSelected({ ...unit })}><b>{unit.number}</b><span>Piso {unit.floor} · {unit.surface} m²</span><em className={`dot ${unit.status?.toLowerCase()}`}>{unit.status}</em><strong>{unit.currency} {Number(unit.price || 0).toLocaleString('en-US')}</strong></button>)}</div></div>
      <div className="adminPanel">{selected ? <form onSubmit={saveUnit}><div className="panelTitle"><span>Editar unidad {selected.number}</span><small>Fuente de verdad comercial</small></div><div className="formGrid"><Field label="Número" value={selected.number} onChange={(e) => setSelected({ ...selected, number: e.target.value })} /><Field label="Superficie m²" type="number" value={selected.surface} onChange={(e) => setSelected({ ...selected, surface: e.target.value })} /><Field label="Dormitorios" type="number" value={selected.bedrooms} onChange={(e) => setSelected({ ...selected, bedrooms: e.target.value })} /><Field label="Baños" type="number" value={selected.bathrooms} onChange={(e) => setSelected({ ...selected, bathrooms: e.target.value })} /><Field label="Precio" type="number" value={selected.price} onChange={(e) => setSelected({ ...selected, price: e.target.value })} /><Field label="Moneda" value={selected.currency || 'USD'} onChange={(e) => setSelected({ ...selected, currency: e.target.value })} /></div><label className="adminField"><span>Estado</span><select value={selected.status} onChange={(e) => setSelected({ ...selected, status: e.target.value })}><option value="AVAILABLE">Disponible</option><option value="RESERVED">Reservada</option><option value="SOLD">Vendida</option><option value="BLOCKED">Bloqueada</option></select></label><label className="adminField"><span>Descripción</span><textarea value={selected.description || ''} onChange={(e) => setSelected({ ...selected, description: e.target.value })} /></label><button className="adminPrimary" disabled={saving}>{saving ? 'Guardando…' : 'Guardar cambios'}</button></form> : <div className="emptyState"><span>01</span><h3>Seleccioná una unidad</h3><p>Desde acá el equipo comercial puede mantener precio, superficie y disponibilidad sin tocar el showroom.</p></div>}</div>
    </div>
    {status && <div className="adminNotice">{status}</div>}
  </section>;
}

function TenantPortal() {
  const [apiKey, setApiKey] = useState(localStorage.getItem('realestate_tenant_key') || '');
  const [company, setCompany] = useState(null);
  const [projects, setProjects] = useState([]);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState('');
  const headers = useMemo(() => ({ 'x-api-key': apiKey }), [apiKey]);

  const connect = async () => {
    setError('');
    try {
      const me = await getJson('/admin/me', { headers });
      localStorage.setItem('realestate_tenant_key', apiKey); setCompany(me); setProjects(await getJson(`/admin/companies/${me.id}/projects`, { headers }));
    } catch (e) { setError(e.message); }
  };
  useEffect(() => { if (apiKey) connect(); }, []);
  const refresh = async () => setProjects(await getJson(`/admin/companies/${company.id}/projects`, { headers }));

  if (!company) return <Login title="Acceso de empresa" subtitle="Ingresá la API key que te asignó REALESTATE." value={apiKey} setValue={setApiKey} onSubmit={connect} error={error} />;
  return <PortalShell brand={company.name} subtitle="Workspace privado"><div className="portalLayout"><aside className="adminSidebar"><div className="sidebarLabel">PROYECTOS</div>{projects.map((p) => <button className={selected?.id === p.id ? 'active' : ''} key={p.id} onClick={() => setSelected(p)}><span>{p.name}</span><small>{p.status || 'DRAFT'}</small></button>)}<button className="sidebarNew" onClick={() => setSelected({ create: true, companyId: company.id })}>+ Nuevo proyecto</button></aside><main>{selected?.create ? <CreateProject company={company} apiKey={apiKey} onCreated={async (p) => { await refresh(); setSelected(p); }} /> : selected ? <ProjectEditor project={selected} apiKey={apiKey} onRefresh={refresh} /> : <EmptyPortal company={company} />}</main></div></PortalShell>;
}

function CreateProject({ company, apiKey, onCreated }) {
  const [form, setForm] = useState({ name: '', slug: '', description: '' }); const [error, setError] = useState('');
  const submit = async (e) => { e.preventDefault(); try { const p = await getJson('/admin/projects', { method: 'POST', headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, companyId: company.id }) }); onCreated(p); } catch (err) { setError(err.message); } };
  return <section className="adminWorkspace"><span className="adminKicker">NUEVO PROYECTO</span><h2>Crear un nuevo showroom.</h2><p className="adminLead">Cada proyecto queda aislado dentro de tu empresa y utiliza la misma plataforma.</p><form className="projectForm" onSubmit={submit}><Field label="Nombre del proyecto" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /><Field label="Slug interno" required value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} /><label className="adminField"><span>Descripción</span><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label><button className="adminPrimary">Crear proyecto</button>{error && <div className="adminNotice">{error}</div>}</form></section>;
}

function PlatformPortal() {
  const [key, setKey] = useState(localStorage.getItem('realestate_platform_key') || ''); const [companies, setCompanies] = useState([]); const [error, setError] = useState('');
  const load = async () => { try { const data = await getJson('/admin/companies', { headers: { 'x-platform-key': key } }); localStorage.setItem('realestate_platform_key', key); setCompanies(data); } catch (e) { setError(e.message); } };
  useEffect(() => { if (key) load(); }, []);
  if (!companies.length && !error) return <Login title="Platform Owner" subtitle="Acceso global de REALESTATE." value={key} setValue={setKey} onSubmit={load} error="" />;
  return <PortalShell brand="REALESTATE" subtitle="Platform Owner"><section className="platformOverview"><div className="overviewHead"><div><span className="adminKicker">CONTROL CENTER</span><h1>Todas las empresas.</h1><p>Vista global exclusiva del operador de la plataforma. Cada tenant permanece aislado.</p></div><button className="adminGhost" onClick={load}>Actualizar</button></div><div className="companyGrid">{companies.map((c) => <article className="companyCard" key={c.id}><span>{c.slug}</span><h2>{c.name}</h2><p>ID · {c.id}</p><div>Workspace privado · API key activa</div></article>)}</div>{error && <div className="adminNotice">{error}</div>}</section></PortalShell>;
}

function Login({ title, subtitle, value, setValue, onSubmit, error }) { return <main className="adminLogin"><div className="loginBox"><span className="adminLogo">RE</span><span className="adminKicker">REALESTATE PLATFORM</span><h1>{title}</h1><p>{subtitle}</p><form onSubmit={(e) => { e.preventDefault(); onSubmit(); }}><Field label="Access key" type="password" value={value} onChange={(e) => setValue(e.target.value)} autoFocus /><button className="adminPrimary">Entrar</button></form>{error && <div className="adminNotice">{error}</div>}</div></main>; }
function PortalShell({ brand, subtitle, children }) { return <div className="adminApp"><header className="adminHeader"><div><b>RE</b><strong>{brand}</strong><small>{subtitle}</small></div><a href="/">Public showroom ↗</a></header>{children}</div>; }
function EmptyPortal({ company }) { return <section className="adminEmpty"><span className="adminKicker">WORKSPACE</span><h1>{company.name}</h1><p>Creá tu primer proyecto para empezar a construir el showroom comercial.</p></section>; }
export default function AdminPortal({ platform = false }) { return platform ? <PlatformPortal /> : <TenantPortal />; }
