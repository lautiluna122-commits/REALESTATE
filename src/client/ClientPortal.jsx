import { useMemo, useState } from 'react';
import { getProjectBySlug, getProjectUnits } from '../platform/projectRegistry';
import { saveInventory, getPublication, savePublication } from '../platform/projectStore';
import './client-portal.css';

function getSlug() {
  return window.location.pathname.match(/^\/cliente\/([^/]+)/)?.[1] ?? 'ocean-mansions';
}

export default function ClientPortal() {
  const project = getProjectBySlug(getSlug());
  const [units, setUnits] = useState(() => getProjectUnits(project));
  const [saved, setSaved] = useState(false);
  const [lastSaved, setLastSaved] = useState(() => getPublication(project.slug)?.updatedAt ?? null);

  const available = useMemo(() => units.filter((u) => u.status === 'AVAILABLE').length, [units]);
  const reserved = units.filter((u) => u.status === 'RESERVED').length;
  const sold = units.filter((u) => u.status === 'SOLD').length;
  const publicPath = `/proyecto/${project.publication?.publicSlug ?? project.slug}`;
  const embedPath = `/embed/${project.publication?.publicSlug ?? project.slug}`;

  function updateUnit(id, field, value) {
    setSaved(false);
    setUnits((current) => current.map((unit) => unit.id === id
      ? { ...unit, [field]: field === 'price' ? Number(String(value).replace(/[^0-9]/g, '')) : value }
      : unit));
  }

  function save() {
    const overrides = saveInventory(project.slug, units);
    const publication = savePublication(project.slug, { status: 'LIVE', inventoryUpdatedAt: new Date().toISOString() });
    setUnits((current) => current.map((unit) => ({ ...unit, ...(overrides[unit.id] ?? {}) })));
    setLastSaved(publication.updatedAt);
    setSaved(true);
  }

  return (
    <div className="client-shell">
      <header className="client-header">
        <div className="client-logo"><span>RE</span><div><strong>REALESTATE</strong><small>CLIENT CONTROL</small></div></div>
        <div className="client-project"><small>PROYECTO</small><strong>{project.name}</strong></div>
        <div className="client-actions"><a href={publicPath} target="_blank" rel="noreferrer">Ver showroom ↗</a><a href={embedPath} target="_blank" rel="noreferrer">Modo lector ↗</a></div>
      </header>

      <main className="client-main">
        <div className="client-intro"><div><span className="eyebrow">CONTROL COMERCIAL</span><h1>{project.name}</h1><p>Actualizá precio y disponibilidad sin tocar la experiencia 3D.</p>{lastSaved && <small className="save-meta">Última actualización local: {new Date(lastSaved).toLocaleString()}</small>}</div><button className="save-button" onClick={save}>{saved ? '✓ Cambios guardados' : 'Guardar cambios'}</button></div>

        <section className="client-metrics">
          <Metric label="Unidades" value={units.length} detail="inventario total" />
          <Metric label="Disponibles" value={available} detail="para venta" />
          <Metric label="Reservadas" value={reserved} detail={`${sold} vendidas`} />
          <Metric label="Interacciones" value="1.284" detail="últimos 30 días · demo" />
        </section>

        <section className="client-grid">
          <article className="client-card inventory-card">
            <div className="card-title"><div><span className="eyebrow">INVENTARIO LIVE</span><h2>Precios y disponibilidad</h2></div><span className="live-pill">SYNC</span></div>
            <div className="client-table">
              <div className="client-row client-head"><span>Unidad</span><span>Piso</span><span>m²</span><span>Precio USD</span><span>Estado</span></div>
              {units.map((unit) => <div className="client-row" key={unit.id}>
                <strong>{unit.number || unit.id}</strong><span>{unit.floor}</span><span>{unit.area ?? unit.surface ?? '—'}</span>
                <input aria-label={`Precio ${unit.number || unit.id}`} value={Number(unit.price ?? 0).toLocaleString('en-US')} onChange={(e) => updateUnit(unit.id, 'price', e.target.value)} />
                <select value={unit.status} onChange={(e) => updateUnit(unit.id, 'status', e.target.value)}><option value="AVAILABLE">Disponible</option><option value="RESERVED">Reservada</option><option value="SOLD">Vendida</option></select>
              </div>)}
            </div>
          </article>

          <aside className="client-card analytics-card">
            <div className="card-title"><div><span className="eyebrow">ANALYTICS</span><h2>Comportamiento</h2></div></div>
            <div className="funnel"><Funnel label="Visitas al showroom" value="1.284" width="100%" /><Funnel label="Selección de unidad" value="438" width="62%" /><Funnel label="Planos abiertos" value="216" width="42%" /><Funnel label="Contacto" value="74" width="24%" /></div>
            <div className="analytics-note"><strong>↑ 18%</strong><span>más interacción que el período anterior · datos demo</span></div>
          </aside>
        </section>

        <section className="client-card links-card"><div><span className="eyebrow">PUBLICACIÓN</span><h2>Tus dos accesos</h2><p>Uno para gestionar. Otro para mostrar.</p></div><div className="share-links"><ShareLink title="Control del proyecto" path={`/cliente/${project.publication?.publicSlug ?? project.slug}`} text="Privado · precios · disponibilidad · métricas" /><ShareLink title="Reader / Embed" path={embedPath} text="Público · experiencia · solo lectura" /></div></section>
      </main>
    </div>
  );
}

function Metric({ label, value, detail }) { return <div className="client-metric"><small>{label}</small><strong>{value}</strong><span>{detail}</span></div>; }
function Funnel({ label, value, width }) { return <div className="funnel-item"><div><span>{label}</span><b>{value}</b></div><i style={{ width }} /></div>; }
function ShareLink({ title, path, text }) { return <a className="share-link" href={path} target="_blank" rel="noreferrer"><span>↗</span><div><strong>{title}</strong><small>{text}</small><code>{window.location.origin}{path}</code></div></a>; }
