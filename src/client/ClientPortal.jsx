import { useMemo, useState } from 'react';
import { getProjectBySlug, getProjectUnits } from '../platform/projectRegistry';
import './client-portal.css';

function getSlug() {
  return window.location.pathname.match(/^\/cliente\/([^/]+)/)?.[1] ?? 'ocean-mansions';
}

export default function ClientPortal() {
  const project = getProjectBySlug(getSlug());
  const initialUnits = getProjectUnits(project);
  const [units, setUnits] = useState(initialUnits);
  const [saved, setSaved] = useState(false);

  const available = useMemo(() => units.filter((u) => u.status === 'AVAILABLE').length, [units]);
  const reserved = units.length - available;
  const publicUrl = `/proyecto/${project.publication?.publicSlug ?? project.slug}`;
  const embedUrl = `/embed/${project.publication?.publicSlug ?? project.slug}`;

  function updateUnit(id, field, value) {
    setSaved(false);
    setUnits((current) => current.map((unit) => unit.id === id ? { ...unit, [field]: field === 'price' ? Number(value.replace(/[^0-9]/g, '')) : value } : unit));
  }

  function save() {
    // Demo persistence layer: this surface is intentionally ready to be connected to the API.
    setSaved(true);
  }

  return (
    <div className="client-shell">
      <header className="client-header">
        <div className="client-logo"><span>RE</span><div><strong>REALESTATE</strong><small>CLIENT CONTROL</small></div></div>
        <div className="client-project"><small>PROYECTO</small><strong>{project.name}</strong></div>
        <div className="client-actions"><a href={publicUrl} target="_blank" rel="noreferrer">Ver showroom ↗</a><a href={embedUrl} target="_blank" rel="noreferrer">Modo lector ↗</a></div>
      </header>

      <main className="client-main">
        <div className="client-intro"><div><span className="eyebrow">CONTROL COMERCIAL</span><h1>{project.name}</h1><p>Actualizá la información comercial del proyecto sin tocar el showroom.</p></div><button className="save-button" onClick={save}>{saved ? '✓ Cambios guardados' : 'Guardar cambios'}</button></div>

        <section className="client-metrics">
          <Metric label="Unidades" value={units.length} detail="inventario total" />
          <Metric label="Disponibles" value={available} detail="para venta" />
          <Metric label="Reservadas" value={reserved} detail="estado comercial" />
          <Metric label="Interacciones" value="1.284" detail="últimos 30 días" />
        </section>

        <section className="client-grid">
          <article className="client-card inventory-card">
            <div className="card-title"><div><span className="eyebrow">INVENTARIO</span><h2>Precios y disponibilidad</h2></div><span className="live-pill">LIVE</span></div>
            <div className="client-table">
              <div className="client-row client-head"><span>Unidad</span><span>Piso</span><span>m²</span><span>Precio USD</span><span>Estado</span></div>
              {units.slice(0, 12).map((unit) => <div className="client-row" key={unit.id}>
                <strong>{unit.number || unit.id}</strong><span>{unit.floor}</span><span>{unit.area}</span>
                <input aria-label={`Precio ${unit.number || unit.id}`} value={Number(unit.price).toLocaleString('en-US')} onChange={(e) => updateUnit(unit.id, 'price', e.target.value)} />
                <select value={unit.status} onChange={(e) => updateUnit(unit.id, 'status', e.target.value)}><option value="AVAILABLE">Disponible</option><option value="RESERVED">Reservada</option><option value="SOLD">Vendida</option></select>
              </div>)}
            </div>
          </article>

          <aside className="client-card analytics-card">
            <div className="card-title"><div><span className="eyebrow">ANALYTICS</span><h2>Comportamiento</h2></div></div>
            <div className="funnel"><Funnel label="Visitas al showroom" value="1.284" width="100%" /><Funnel label="Selección de unidad" value="438" width="62%" /><Funnel label="Planos abiertos" value="216" width="42%" /><Funnel label="Contacto" value="74" width="24%" /></div>
            <div className="analytics-note"><strong>↑ 18%</strong><span>más interacción que el período anterior</span></div>
          </aside>
        </section>

        <section className="client-card links-card"><div><span className="eyebrow">PUBLICACIÓN</span><h2>Tus dos accesos</h2><p>Uno para gestionar. Otro para mostrar.</p></div><div className="share-links"><ShareLink title="Control del proyecto" path={`/cliente/${project.publication?.publicSlug ?? project.slug}`} text="Precios · disponibilidad · métricas" /><ShareLink title="Reader / Embed" path={embedUrl} text="Experiencia pública · solo lectura" /></div></section>
      </main>
    </div>
  );
}

function Metric({ label, value, detail }) { return <div className="client-metric"><small>{label}</small><strong>{value}</strong><span>{detail}</span></div>; }
function Funnel({ label, value, width }) { return <div className="funnel-item"><div><span>{label}</span><b>{value}</b></div><i style={{ width }} /></div>; }
function ShareLink({ title, path, text }) { return <a className="share-link" href={path} target="_blank" rel="noreferrer"><span>↗</span><div><strong>{title}</strong><small>{text}</small><code>{window.location.origin}{path}</code></div></a>; }
