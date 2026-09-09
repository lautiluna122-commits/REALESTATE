import { useEffect, useMemo, useState } from 'react';
import { getProjectBySlug, getProjectUnits } from '../platform/projectRegistry';
import { saveInventory, getPublication, savePublication } from '../platform/projectStore';
import { ANALYTICS_EVENT } from '../platform/analytics';
import { platformApi } from '../platform/platformApi';
import './client-portal.css';

function getSlug() { return window.location.pathname.match(/^\/cliente\/([^/]+)/)?.[1] ?? 'ocean-mansions'; }
function formatMetric(analytics, eventName, fallback = 0) { return analytics?.events?.find((event) => event.event === eventName)?.count ?? fallback; }

export default function ClientPortal() {
  const slug = getSlug();
  const localProject = getProjectBySlug(slug);
  const [project, setProject] = useState(localProject);
  const [serverProjectId, setServerProjectId] = useState(null);
  const [serverCompanyId, setServerCompanyId] = useState(null);
  const [units, setUnits] = useState(() => getProjectUnits(localProject));
  const [analytics, setAnalytics] = useState(null);
  const [requests, setRequests] = useState([]);
  const [dirtyUnits, setDirtyUnits] = useState(() => new Set());
  const [saved, setSaved] = useState(false);
  const [syncState, setSyncState] = useState('loading');
  const [syncError, setSyncError] = useState('');
  const [lastSaved, setLastSaved] = useState(() => getPublication(localProject.slug)?.updatedAt ?? null);
  const [requestType, setRequestType] = useState('CONTENT');
  const [requestTitle, setRequestTitle] = useState('');
  const [requestDescription, setRequestDescription] = useState('');
  const [requestSending, setRequestSending] = useState(false);
  const [requestSent, setRequestSent] = useState(false);

  async function hydrate() {
    setSyncState('loading'); setSyncError('');
    try {
      const server = await platformApi.getProjectBySlug(slug);
      if (!server?.id || !server.companyId) throw new Error('El proyecto no está disponible en el workspace de cliente.');
      const [serverUnits, serverAnalytics, serverRequests] = await Promise.all([
        platformApi.getCompanyProjectUnits(server.companyId, server.id),
        platformApi.getProjectAnalytics(server.id),
        platformApi.listServiceRequests(server.companyId, server.id),
      ]);
      setServerProjectId(server.id); setServerCompanyId(server.companyId);
      setProject((current) => ({ ...current, ...server, publication: current.publication }));
      setUnits(serverUnits.map((unit) => ({ ...unit, area: unit.surface })));
      setAnalytics(serverAnalytics); setRequests(Array.isArray(serverRequests) ? serverRequests : []); setSyncState('live');
    } catch (error) {
      setSyncState('error'); setSyncError(error?.message || 'No se pudo sincronizar el proyecto.');
    }
  }

  useEffect(() => { hydrate(); }, [slug]);

  const available = useMemo(() => units.filter((u) => u.status === 'AVAILABLE').length, [units]);
  const reserved = units.filter((u) => u.status === 'RESERVED').length;
  const sold = units.filter((u) => u.status === 'SOLD').length;
  const publicSlug = project.publication?.publicSlug ?? slug;
  const publicPath = `/proyecto/${publicSlug}`;
  const embedPath = `/embed/${publicSlug}`;
  const showroomOpens = formatMetric(analytics, ANALYTICS_EVENT.SHOWROOM_OPEN);
  const unitSelections = formatMetric(analytics, ANALYTICS_EVENT.UNIT_SELECT);
  const planViews = formatMetric(analytics, ANALYTICS_EVENT.PLAN_VIEW);
  const contacts = formatMetric(analytics, ANALYTICS_EVENT.CTA_CONTACT) + formatMetric(analytics, ANALYTICS_EVENT.CTA_WHATSAPP);

  function updateUnit(id, field, value) {
    setSaved(false); setDirtyUnits((current) => new Set(current).add(id));
    setUnits((current) => current.map((unit) => unit.id === id ? { ...unit, [field]: field === 'price' ? Number(String(value).replace(/[^0-9]/g, '')) : value } : unit));
  }

  async function save() {
    if (syncState !== 'live' || !serverProjectId || !serverCompanyId) return;
    const changed = units.filter((unit) => dirtyUnits.has(unit.id));
    if (!changed.length) { setSaved(true); return; }
    setSaved(false); setSyncError('');
    try {
      const updated = await Promise.all(changed.map((unit) => platformApi.updateCompanyProjectUnit(serverCompanyId, serverProjectId, unit.id, { price: unit.price, status: unit.status })));
      const updatedById = Object.fromEntries(updated.map((unit) => [unit.id, unit]));
      setUnits((current) => current.map((unit) => updatedById[unit.id] ? { ...unit, ...updatedById[unit.id], area: updatedById[unit.id].surface } : unit));
      const freshAnalytics = await platformApi.getProjectAnalytics(serverProjectId);
      setAnalytics(freshAnalytics); setDirtyUnits(new Set()); setSaved(true); setLastSaved(new Date().toISOString());
      saveInventory(project.slug, updated); savePublication(project.slug, { status: 'LIVE', inventoryUpdatedAt: new Date().toISOString() });
    } catch (error) { setSyncError(error?.message || 'No se pudieron guardar los cambios.'); }
  }

  async function submitRequest(event) {
    event.preventDefault();
    if (syncState !== 'live' || !serverCompanyId || !serverProjectId || !requestTitle.trim()) return;
    setRequestSending(true); setRequestSent(false); setSyncError('');
    try {
      const created = await platformApi.createServiceRequest(serverCompanyId, { projectId: serverProjectId, type: requestType, title: requestTitle.trim(), description: requestDescription.trim(), priority: 'NORMAL' });
      setRequests((current) => [created, ...current]); setRequestTitle(''); setRequestDescription(''); setRequestSent(true);
    } catch (error) { setSyncError(error?.message || 'No se pudo crear la solicitud.'); }
    finally { setRequestSending(false); }
  }

  const blocked = syncState !== 'live';
  return (
    <div className="client-shell">
      <header className="client-header">
        <div className="client-logo"><span>RE</span><div><strong>REALESTATE</strong><small>CLIENT CONTROL</small></div></div>
        <div className="client-project"><small>PROYECTO</small><strong>{project.name}</strong></div>
        <div className="client-actions"><a href={publicPath} target="_blank" rel="noreferrer">Ver showroom ↗</a><a href={embedPath} target="_blank" rel="noreferrer">Modo lector ↗</a></div>
      </header>

      <main className="client-main">
        <div className="client-intro"><div><span className="eyebrow">CONTROL COMERCIAL</span><h1>{project.name}</h1><p>Actualizá precio y disponibilidad sin tocar la experiencia 3D.</p><small className="save-meta">{syncState === 'live' ? '● Sincronizado con REALESTATE' : syncState === 'loading' ? '● Conectando con REALESTATE…' : '● Sin conexión al workspace'}{lastSaved ? ` · última actualización ${new Date(lastSaved).toLocaleString()}` : ''}</small></div><button className="save-button" disabled={blocked || !dirtyUnits.size} onClick={save}>{saved ? '✓ Cambios guardados' : 'Guardar cambios'}</button></div>
        {syncError && <div className="client-alert" role="alert"><strong>No se pudo completar la operación.</strong><span>{syncError}</span><button onClick={hydrate}>Reintentar sincronización →</button></div>}

        <section className="client-metrics"><Metric label="Unidades" value={units.length} detail="inventario total" /><Metric label="Disponibles" value={available} detail="para venta" /><Metric label="Reservadas" value={reserved} detail={`${sold} vendidas`} /><Metric label="Interacciones" value={showroomOpens.toLocaleString('es-UY')} detail={analytics ? 'showroom · datos reales' : 'esperando analytics'} /></section>

        <section className="client-grid">
          <article className="client-card inventory-card">
            <div className="card-title"><div><span className="eyebrow">INVENTARIO LIVE</span><h2>Precios y disponibilidad</h2></div><span className="live-pill">{syncState === 'live' ? 'LIVE' : syncState.toUpperCase()}</span></div>
            <div className="client-table"><div className="client-row client-head"><span>Unidad</span><span>Piso</span><span>m²</span><span>Precio USD</span><span>Estado</span></div>{units.map((unit) => <div className="client-row" key={unit.id}><strong>{unit.number || unit.id}</strong><span>{unit.floor ?? '—'}</span><span>{unit.area ?? unit.surface ?? '—'}</span><input aria-label={`Precio ${unit.number || unit.id}`} disabled={blocked} value={Number(unit.price ?? 0).toLocaleString('en-US')} onChange={(e) => updateUnit(unit.id, 'price', e.target.value)} /><select disabled={blocked} value={unit.status} onChange={(e) => updateUnit(unit.id, 'status', e.target.value)}><option value="AVAILABLE">Disponible</option><option value="RESERVED">Reservada</option><option value="SOLD">Vendida</option></select></div>)}</div>
          </article>
          <aside className="client-card analytics-card"><div className="card-title"><div><span className="eyebrow">ANALYTICS</span><h2>Comportamiento</h2></div></div><div className="funnel"><Funnel label="Visitas al showroom" value={showroomOpens.toLocaleString('es-UY')} width="100%" /><Funnel label="Selección de unidad" value={unitSelections.toLocaleString('es-UY')} width={showroomOpens ? `${Math.min(100, Math.round((unitSelections / showroomOpens) * 100))}%` : '0%'} /><Funnel label="Planos abiertos" value={planViews.toLocaleString('es-UY')} width={showroomOpens ? `${Math.min(100, Math.round((planViews / showroomOpens) * 100))}%` : '0%'} /><Funnel label="Contacto" value={contacts.toLocaleString('es-UY')} width={showroomOpens ? `${Math.min(100, Math.round((contacts / showroomOpens) * 100))}%` : '0%'} /></div><div className="analytics-note"><strong>{analytics ? 'LIVE' : '—'}</strong><span>{analytics ? `${analytics.total} eventos registrados en REALESTATE` : 'Los eventos aparecerán cuando el showroom esté conectado.'}</span></div></aside>
        </section>

        <section className="client-card service-card"><div className="card-title"><div><span className="eyebrow">SOLICITUDES</span><h2>Pedí cambios al equipo REALESTATE</h2><p>El cliente puede solicitar actualizaciones sin modificar directamente la plataforma.</p></div></div><div className="service-layout"><form onSubmit={submitRequest}><select disabled={blocked} value={requestType} onChange={(e) => setRequestType(e.target.value)}><option value="CONTENT">Actualizar contenido</option><option value="INVENTORY">Modificar inventario</option><option value="ASSET">Subir / reemplazar asset</option><option value="EXPERIENCE">Modificar experiencia</option><option value="OTHER">Otra solicitud</option></select><input disabled={blocked} value={requestTitle} onChange={(e) => setRequestTitle(e.target.value)} placeholder="Título de la solicitud" required /><textarea disabled={blocked} value={requestDescription} onChange={(e) => setRequestDescription(e.target.value)} placeholder="Describí qué necesitás cambiar…" rows="4" /><button className="save-button" disabled={blocked || requestSending}>{requestSending ? 'Enviando…' : requestSent ? '✓ Solicitud enviada' : 'Enviar solicitud →'}</button></form><div className="request-list">{requests.length ? requests.slice(0, 6).map((request) => <div className="request-row" key={request.id}><span className="request-status">{request.status}</span><div><strong>{request.title}</strong><small>{request.type} · {new Date(request.createdAt).toLocaleDateString('es-UY')}</small></div></div>) : <div className="empty-state">Todavía no hay solicitudes para este proyecto.</div>}</div></div></section>

        <section className="client-card links-card"><div><span className="eyebrow">PUBLICACIÓN</span><h2>Tus dos accesos</h2><p>Uno para gestionar. Otro para mostrar.</p></div><div className="share-links"><ShareLink title="Control del proyecto" path={`/cliente/${publicSlug}`} text="Privado · precios · disponibilidad · métricas" /><ShareLink title="Reader / Embed" path={embedPath} text="Público · experiencia · solo lectura" /></div></section>
      </main>
    </div>
  );
}

function Metric({ label, value, detail }) { return <div className="client-metric"><small>{label}</small><strong>{value}</strong><span>{detail}</span></div>; }
function Funnel({ label, value, width }) { return <div className="funnel-item"><div><span>{label}</span><b>{value}</b></div><i style={{ width }} /></div>; }
function ShareLink({ title, path, text }) { return <a className="share-link" href={path} target="_blank" rel="noreferrer"><span>↗</span><div><strong>{title}</strong><small>{text}</small><code>{window.location.origin}{path}</code></div></a>; }
