import { useEffect, useMemo, useState } from 'react';
import { platformApi } from '../platform/platformApi';
import './project-structure.css';

const tabs = ['Estructura', 'Unidades', 'Planos', 'Assets', 'Amenities'];

export default function ProjectStructure() {
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState('');
  const [tab, setTab] = useState('Estructura');
  const [buildings, setBuildings] = useState([]);
  const [floors, setFloors] = useState([]);
  const [units, setUnits] = useState([]);
  const [plans, setPlans] = useState([]);
  const [assets, setAssets] = useState([]);
  const [amenities, setAmenities] = useState([]);
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [buildingName, setBuildingName] = useState('Edificio principal');
  const [floorNumber, setFloorNumber] = useState('1');
  const [floorName, setFloorName] = useState('Piso 1');
  const [unitNumber, setUnitNumber] = useState('101');
  const [unitSurface, setUnitSurface] = useState('100');
  const [unitPrice, setUnitPrice] = useState('250000');
  const [unitStatus, setUnitStatus] = useState('AVAILABLE');

  async function loadProjects() {
    setLoading(true); setError('');
    try {
      const data = await platformApi.getAdminProjects();
      const next = Array.isArray(data) ? data : [];
      setProjects(next);
      if (!projectId && next[0]) setProjectId(next[0].id);
    } catch (err) { setError(err?.message || 'No se pudieron cargar los proyectos.'); }
    finally { setLoading(false); }
  }

  async function loadStructure(id = projectId) {
    if (!id) return;
    setLoading(true); setError(''); setMessage('');
    try {
      const [b, f, u, p, a, am, l] = await Promise.all([
        platformApi.getProjectBuildings(id), platformApi.getProjectFloors(id), platformApi.getProjectUnitsAdmin(id),
        platformApi.getProjectPlans(id), platformApi.getProjectAssets(id), platformApi.getProjectAmenities(id), platformApi.getProjectLocation(id),
      ]);
      setBuildings(b || []); setFloors(f || []); setUnits(u || []); setPlans(p || []); setAssets(a || []); setAmenities(am || []); setLocation(l || null);
    } catch (err) { setError(err?.message || 'No se pudo cargar la estructura del proyecto.'); }
    finally { setLoading(false); }
  }

  useEffect(() => { loadProjects(); }, []);
  useEffect(() => { if (projectId) loadStructure(projectId); }, [projectId]);

  const selected = projects.find((p) => p.id === projectId) || null;
  const selectedBuilding = buildings[0] || null;
  const selectedFloor = floors.find((f) => f.buildingId === selectedBuilding?.id) || floors[0] || null;
  const groupedUnits = useMemo(() => units.reduce((acc, unit) => { const key = unit.floorId || 'sin-piso'; (acc[key] ||= []).push(unit); return acc; }, {}), [units]);

  async function createBuilding() {
    if (!projectId || !buildingName.trim()) return;
    setSaving(true); setError('');
    try { await platformApi.createProjectBuilding(projectId, { name: buildingName.trim(), reference: buildingName.trim() }); setMessage('Edificio creado.'); await loadStructure(); }
    catch (err) { setError(err?.message || 'No se pudo crear el edificio.'); }
    finally { setSaving(false); }
  }

  async function createFloor() {
    if (!projectId || !selectedBuilding || !floorNumber) return;
    setSaving(true); setError('');
    try { await platformApi.createProjectFloor(projectId, { buildingId: selectedBuilding.id, number: Number(floorNumber), name: floorName.trim() }); setMessage('Piso creado.'); await loadStructure(); }
    catch (err) { setError(err?.message || 'No se pudo crear el piso.'); }
    finally { setSaving(false); }
  }

  async function createUnit() {
    if (!projectId || !selectedBuilding || !selectedFloor || !unitNumber.trim()) return;
    setSaving(true); setError('');
    try {
      await platformApi.createProjectUnit(projectId, { buildingId: selectedBuilding.id, floorId: selectedFloor.id, number: unitNumber.trim(), surface: Number(unitSurface), bedrooms: 2, bathrooms: 2, terrace: 15, price: Number(unitPrice), currency: 'USD', status: unitStatus, description: '', images: [] });
      setMessage('Unidad creada.'); await loadStructure();
    } catch (err) { setError(err?.message || 'No se pudo crear la unidad.'); }
    finally { setSaving(false); }
  }

  return <div className="structure-shell">
    <header className="structure-header">
      <div><span>REALESTATE / DATA STUDIO</span><h1>Estructura del proyecto</h1><p>La fuente de verdad que alimenta inventario, contenido, experiencia y publicación.</p></div>
      <div className="structure-actions"><a href="/admin">← Dashboard</a><a href="/studio">Studio →</a></div>
    </header>
    <div className="structure-toolbar">
      <label>Proyecto<select value={projectId} onChange={(e) => setProjectId(e.target.value)}><option value="">Seleccionar proyecto</option>{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
      <div className="structure-summary"><b>{selected?.status || '—'}</b><span>{buildings.length} edificios · {floors.length} pisos · {units.length} unidades · {assets.length} assets</span></div>
    </div>
    <nav className="structure-tabs">{tabs.map((item) => <button key={item} className={tab === item ? 'active' : ''} onClick={() => setTab(item)}>{item}</button>)}</nav>
    {error && <div className="structure-alert error"><strong>Operación no completada</strong><span>{error}</span><button onClick={() => loadStructure()}>Reintentar</button></div>}
    {message && <div className="structure-alert success">✓ {message}</div>}
    {loading ? <div className="structure-loading">Cargando estructura…</div> : !projectId ? <div className="structure-empty">Seleccioná un proyecto para trabajar.</div> : <>
      {tab === 'Estructura' && <section className="structure-grid">
        <article className="structure-card"><Header title="Edificios" count={buildings.length}/><div className="list">{buildings.map((b) => <div className="list-row" key={b.id}><strong>{b.name}</strong><small>{b.reference || 'Sin referencia'} · {floors.filter((f) => f.buildingId === b.id).length} pisos</small></div>)}{!buildings.length && <Empty text="Todavía no hay edificios."/>}</div><div className="inline-form"><input value={buildingName} onChange={(e) => setBuildingName(e.target.value)} placeholder="Nombre del edificio"/><button disabled={saving} onClick={createBuilding}>+ Edificio</button></div></article>
        <article className="structure-card"><Header title="Pisos" count={floors.length}/><div className="list">{floors.map((f) => <div className="list-row" key={f.id}><strong>Piso {f.number}</strong><small>{f.name || 'Sin nombre'} · {units.filter((u) => u.floorId === f.id).length} unidades</small></div>)}{!floors.length && <Empty text={buildings.length ? 'Creá el primer piso.' : 'Primero creá un edificio.'}/>}</div><div className="inline-form two"><input type="number" value={floorNumber} onChange={(e) => setFloorNumber(e.target.value)} placeholder="N°"/><input value={floorName} onChange={(e) => setFloorName(e.target.value)} placeholder="Nombre"/><button disabled={saving || !selectedBuilding} onClick={createFloor}>+ Piso</button></div></article>
        <article className="structure-card wide"><Header title="Cadena espacial" count={units.length}/><div className="chain"><Node label="Proyecto" value={selected?.name}/><span>→</span><Node label="Edificio" value={selectedBuilding?.name || 'Pendiente'}/><span>→</span><Node label="Piso" value={selectedFloor ? `${selectedFloor.number} · ${selectedFloor.name || ''}` : 'Pendiente'}/><span>→</span><Node label="Unidad" value={selectedFloor ? `${groupedUnits[selectedFloor.id]?.length || 0} vinculadas` : 'Pendiente'}/></div><p className="structure-note">No se puede crear una unidad sin edificio y piso válidos. El backend valida estas relaciones para evitar datos cruzados entre proyectos.</p><div className="inline-form unit-form"><input value={unitNumber} onChange={(e) => setUnitNumber(e.target.value)} placeholder="Unidad"/><input type="number" value={unitSurface} onChange={(e) => setUnitSurface(e.target.value)} placeholder="m²"/><input type="number" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} placeholder="Precio USD"/><select value={unitStatus} onChange={(e) => setUnitStatus(e.target.value)}><option value="AVAILABLE">Disponible</option><option value="RESERVED">Reservada</option><option value="SOLD">Vendida</option></select><button disabled={saving || !selectedFloor} onClick={createUnit}>+ Unidad</button></div></article>
        <article className="structure-card"><Header title="Ubicación" count={location ? 1 : 0}/>{location ? <div className="location-box"><strong>{location.name || selected?.name}</strong><span>{location.district || '—'}</span><span>{location.city || '—'}, {location.country || '—'}</span><code>{location.coordinates ? JSON.stringify(location.coordinates) : 'Sin coordenadas'}</code></div> : <Empty text="Ubicación todavía no configurada."/>}</article>
      </section>}
      {tab === 'Unidades' && <DataTable title="Inventario maestro" rows={units} columns={['number','floorId','surface','bedrooms','bathrooms','price','currency','status']} />}
      {tab === 'Planos' && <DataTable title="Planos registrados" rows={plans} columns={['name','kind','description','filePath']} />}
      {tab === 'Assets' && <DataTable title="Assets del proyecto" rows={assets} columns={['name','kind','mimeType','url','isPrimary']} />}
      {tab === 'Amenities' && <DataTable title="Amenities" rows={amenities} columns={['name','category','description']} />}
    </>}
  </div>;
}

function Header({ title, count }) { return <div className="structure-card-head"><div><span>DATA</span><h2>{title}</h2></div><b>{count}</b></div>; }
function Node({ label, value }) { return <div className="chain-node"><small>{label}</small><strong>{value || '—'}</strong></div>; }
function Empty({ text }) { return <div className="empty-row">{text}</div>; }
function DataTable({ title, rows, columns }) { return <section className="structure-card wide"><Header title={title} count={rows.length}/><div className="data-table"><div className="data-row head">{columns.map((c) => <span key={c}>{c}</span>)}</div>{rows.map((row) => <div className="data-row" key={row.id}>{columns.map((c) => <span key={c}>{typeof row[c] === 'object' ? JSON.stringify(row[c]) : String(row[c] ?? '—')}</span>)}</div>)}{!rows.length && <Empty text="No hay registros todavía."/>}</div></section>; }
