import { useMemo, useState } from 'react';
import { getProjectById } from '../platform/projectRegistry';
import { STATUS_LABELS } from '../domain/platformModels';

const project = getProjectById('ocean-mansions');
const units = project.units ?? [];
const floors = [...new Set(units.map((unit) => unit.floor))].sort((a, b) => b - a);
const statusOptions = [...new Set(units.map((unit) => STATUS_LABELS[unit.status] ?? unit.status))];
const formatPrice = (value) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value ?? 0);
const formatStatus = (status) => STATUS_LABELS[status] ?? status;

export default function DemoPortal() {
  const [section, setSection] = useState('overview');
  const [floor, setFloor] = useState('Todos');
  const [status, setStatus] = useState('Todos');
  const [selectedUnit, setSelectedUnit] = useState(null);

  const filteredUnits = useMemo(() => units.filter((unit) => {
    return (floor === 'Todos' || unit.floor === Number(floor)) && (status === 'Todos' || formatStatus(unit.status) === status);
  }), [floor, status]);

  const availableCount = units.filter((unit) => formatStatus(unit.status) === 'Disponible').length;
  const totalArea = units.reduce((sum, unit) => sum + Number(unit.surface ?? 0), 0);
  const goShowroom = () => { window.location.href = '/'; };

  return (
    <div className="demo-portal">
      <aside className="demo-sidebar">
        <div className="demo-brand"><span className="demo-mark">R</span><div><strong>REALESTATE</strong><small>Experience Platform</small></div></div>
        <div className="demo-context"><span>PROYECTO DEMO</span><strong>{project.name}</strong><small>{project.location?.city ?? 'Punta del Este'} · {project.location?.district ?? 'Playa Mansa'}</small></div>
        <nav>{[['overview', 'Resumen'], ['building', 'Edificio 3D'], ['inventory', 'Inventario'], ['plans', 'Planos'], ['amenities', 'Amenities'], ['publication', 'Publicación']].map(([key, label]) => <button key={key} className={section === key ? 'active' : ''} onClick={() => setSection(key)}>{label}</button>)}</nav>
        <button className="demo-public" onClick={goShowroom}>Abrir showroom público ↗</button>
      </aside>
      <main className="demo-main">
        <header className="demo-header"><div><span className="eyebrow">PANEL DE PROYECTO</span><h1>{section === 'overview' ? project.name : sectionLabel(section)}</h1></div><div className="demo-header-actions"><span className="live-dot">Publicado</span><button className="ghost" onClick={goShowroom}>Ver experiencia</button><div className="avatar">RG</div></div></header>
        {section === 'overview' && <Overview project={project} units={units} availableCount={availableCount} totalArea={totalArea} onShowroom={goShowroom} onInventory={() => setSection('inventory')} />}
        {section === 'building' && <BuildingPreview onShowroom={goShowroom} />}
        {section === 'inventory' && <Inventory floor={floor} status={status} setFloor={setFloor} setStatus={setStatus} units={filteredUnits} floors={floors} statusOptions={statusOptions} selectedUnit={selectedUnit} setSelectedUnit={setSelectedUnit} />}
        {section === 'plans' && <EmptyPanel title="Planos" text="Biblioteca de planos por edificio, piso y unidad. Preparada para conectar archivos reales." />}
        {section === 'amenities' && <EmptyPanel title="Amenities" text={(project.amenities ?? []).map((item) => item.name).join(' · ') || 'Piscina · Wellness · Sky Lounge · Lobby'} />}
        {section === 'publication' && <Publication project={project} onShowroom={goShowroom} />}
      </main>
    </div>
  );
}

function sectionLabel(section) { return { building: 'Edificio 3D', inventory: 'Inventario', plans: 'Planos', amenities: 'Amenities', publication: 'Publicación' }[section] ?? 'Proyecto'; }
function Overview({ project, units, availableCount, totalArea, onShowroom, onInventory }) { return <><section className="hero-card"><div className="hero-copy"><span className="eyebrow light">EXPERIENCIA INMOBILIARIA DIGITAL</span><h2>Del plano al<br /><em>showroom 3D.</em></h2><p>Una única estructura para gestionar {project.name}, vender unidades y publicar una experiencia interactiva.</p><div className="hero-actions"><button onClick={onShowroom}>Explorar experiencia 3D <span>↗</span></button><button className="hero-secondary" onClick={onInventory}>Ver inventario</button></div></div><div className="hero-building" aria-hidden="true"><div className="tower"><i /><i /><i /><i /><i /><i /><i /><i /></div><div className="sea" /></div></section><div className="stats-grid"><Stat label="Unidades" value={units.length} meta={`${new Set(units.map((unit) => unit.floor)).size} pisos con inventario`} /><Stat label="Disponibles" value={availableCount} meta={units.length ? `${Math.round((availableCount / units.length) * 100)}% del inventario` : 'sin inventario'} /><Stat label="Superficie" value={`${formatPrice(totalArea)} m²`} meta="residencial" /><Stat label="Publicación" value={project.publication?.isPublished ? 'LIVE' : 'DRAFT'} meta={project.publication?.publicSlug ?? project.slug} /></div><section className="two-col"><div className="panel"><div className="panel-head"><div><span className="eyebrow">ESTRUCTURA</span><h3>Proyecto organizado</h3></div></div><div className="tree"><div><b>{project.companyId}</b><span>Constructora</span></div><div><b>{project.name}</b><span>Proyecto</span></div><div><b>Edificio principal</b><span>{new Set(units.map((unit) => unit.floor)).size} pisos · {units.length} unidades</span></div><div><b>Experiencia 3D</b><span>Web · interactiva</span></div></div></div><div className="panel"><div className="panel-head"><div><span className="eyebrow">RECORRIDO</span><h3>Lo que verá el comprador</h3></div></div><ol className="journey"><li><b>01</b><span>Vista aérea del proyecto</span></li><li><b>02</b><span>Explorar edificio y pisos</span></li><li><b>03</b><span>Elegir una unidad</span></li><li><b>04</b><span>Ver plano y recorrer interior</span></li></ol></div></section></>; }
function Stat({ label, value, meta }) { return <div className="stat"><span>{label}</span><strong>{value}</strong><small>{meta}</small></div>; }
function BuildingPreview({ onShowroom }) { return <section className="building-stage"><div className="stage-copy"><span className="eyebrow light">3D EXPERIENCE</span><h2>El edificio es el<br /><em>centro del producto.</em></h2><p>Esta pantalla es el puente entre los datos del proyecto y el renderer. El siguiente paso es conectar selección de piso, unidad y cámara a la experiencia web.</p><button onClick={onShowroom}>Abrir experiencia actual ↗</button></div><div className="stage-tower"><div className="stage-glow" /><div className="stage-building">{Array.from({ length: 12 }).map((_, i) => <div className="stage-floor" key={i}><span /><span /><span /><span /></div>)}</div><div className="stage-ground" /></div></section>; }
function Inventory({ floor, status, setFloor, setStatus, units, floors, statusOptions, selectedUnit, setSelectedUnit }) { return <section className="panel inventory-panel"><div className="panel-head"><div><span className="eyebrow">INVENTARIO COMERCIAL</span><h3>Unidades</h3></div><span className="result-count">{units.length} resultados</span></div><div className="filters"><select value={floor} onChange={(e) => setFloor(e.target.value)}><option>Todos</option>{floors.map((item) => <option key={item}>{item}</option>)}</select><select value={status} onChange={(e) => setStatus(e.target.value)}><option>Todos</option>{statusOptions.map((item) => <option key={item}>{item}</option>)}</select></div><div className="table"><div className="tr th"><span>Unidad</span><span>Piso</span><span>Tipo</span><span>Área</span><span>Precio</span><span>Estado</span></div>{units.map((unit) => <button className={`tr ${selectedUnit?.id === unit.id ? 'selected' : ''}`} key={unit.id} onClick={() => setSelectedUnit(unit)}><span><b>{unit.number ?? unit.id}</b></span><span>{unit.floor}</span><span>{unit.plan ?? `${unit.bedrooms ?? '-'} dormitorios`}</span><span>{unit.surface ?? '-'} m²</span><span>{unit.currency ?? 'USD'} {formatPrice(unit.price)}</span><span><i className={`status ${formatStatus(unit.status).toLowerCase()}`} />{formatStatus(unit.status)}</span></button>)}</div>{selectedUnit && <div className="unit-detail"><div><span className="eyebrow">UNIDAD SELECCIONADA</span><h3>{selectedUnit.number ?? selectedUnit.id} · Piso {selectedUnit.floor}</h3></div><p>{selectedUnit.plan ?? ''} · {selectedUnit.surface ?? '-'} m² · {selectedUnit.currency ?? 'USD'} {formatPrice(selectedUnit.price)}</p><button onClick={() => setSelectedUnit(null)}>Cerrar</button></div>}</section>; }
function EmptyPanel({ title, text }) { return <section className="panel empty-panel"><span className="empty-icon">+</span><span className="eyebrow">MÓDULO</span><h2>{title}</h2><p>{text}</p><button>Preparado para conectar API</button></section>; }
function Publication({ project, onShowroom }) { return <section className="panel publication"><span className="eyebrow">PUBLICACIÓN</span><h2>{project.name} está {project.publication?.isPublished ? 'online' : 'en borrador'}.</h2><p>La constructora podrá compartir una URL pública desde su propia web, sin exponer el panel de administración.</p><div className="url-box">/showroom/{project.publication?.publicSlug ?? project.slug} <button onClick={onShowroom}>Abrir ↗</button></div><div className="publish-grid"><div><b>Estado</b><strong><i className="status disponible" /> {project.publication?.isPublished ? 'Publicado' : 'Borrador'}</strong></div><div><b>Slug público</b><strong>{project.publication?.publicSlug ?? project.slug}</strong></div><div><b>Acceso</b><strong>Solo lectura</strong></div></div></section>; }
