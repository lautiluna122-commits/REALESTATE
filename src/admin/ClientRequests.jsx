import { useEffect, useState } from 'react';
import { platformApi } from '../platform/platformApi';

export default function ClientRequests() {
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState('');
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadProjects() {
    const result = await platformApi.getAdminProjects();
    setProjects(Array.isArray(result) ? result : []);
    if (!projectId && result?.[0]) setProjectId(result[0].id);
  }

  async function loadRequests(id = projectId) {
    if (!id) return;
    setLoading(true); setError('');
    try {
      const result = await platformApi.listServiceRequests(id);
      setRequests(Array.isArray(result) ? result : []);
    } catch (err) { setError(err?.message || 'No se pudieron cargar las solicitudes.'); }
    finally { setLoading(false); }
  }

  useEffect(() => { loadProjects().catch((err) => { setError(err?.message || 'No se pudieron cargar los proyectos.'); setLoading(false); }); }, []);
  useEffect(() => { if (projectId) loadRequests(projectId); }, [projectId]);

  return <main style={{ minHeight: '100vh', background: '#080c12', color: '#f4f5f7', padding: 32, fontFamily: 'Inter, system-ui, sans-serif' }}>
    <header style={{ maxWidth: 1180, margin: '0 auto 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'end', gap: 20 }}>
      <div><small style={{ letterSpacing: '.16em', opacity: .5 }}>REALESTATE / OPERATIONS</small><h1 style={{ fontSize: 38, margin: '8px 0' }}>Solicitudes</h1><p style={{ opacity: .65, margin: 0 }}>Pedidos de modificación enviados por las constructoras.</p></div>
      <div style={{ display: 'flex', gap: 10 }}><a href="/admin/inventory" style={linkStyle}>Inventario</a><a href="/admin" style={linkStyle}>Dashboard</a></div>
    </header>
    <section style={panelStyle}><label style={{ display: 'grid', gap: 7, maxWidth: 460 }}>Proyecto<select value={projectId} onChange={(e) => setProjectId(e.target.value)} style={inputStyle}>{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label></section>
    {error && <div style={{ ...alertStyle, borderColor: '#8f4545' }}>⚠ {error}</div>}
    {loading ? <div style={emptyStyle}>Cargando solicitudes…</div> : <section style={panelStyle}>
      {!requests.length ? <div style={emptyStyle}>No hay solicitudes registradas.</div> : requests.map((request) => <article key={request.id} style={rowStyle}><div><strong>{request.type || 'Solicitud'}</strong><div style={{ opacity: .65, marginTop: 5 }}>{request.message || request.description || 'Sin descripción'}</div></div><span style={badgeStyle}>{request.status || 'OPEN'}</span></article>)}
    </section>}
  </main>;
}
const linkStyle = { color: '#f4f5f7', textDecoration: 'none', border: '1px solid #2b3440', borderRadius: 10, padding: '10px 14px' };
const panelStyle = { maxWidth: 1180, margin: '0 auto 18px', background: '#0e141d', border: '1px solid #202a36', borderRadius: 16, padding: 20 };
const inputStyle = { background: '#080c12', color: '#f4f5f7', border: '1px solid #303b49', borderRadius: 8, padding: '10px' };
const alertStyle = { maxWidth: 1180, margin: '0 auto 18px', background: '#0e141d', border: '1px solid', borderRadius: 12, padding: 14 };
const emptyStyle = { opacity: .6, padding: 24 };
const rowStyle = { display: 'flex', justifyContent: 'space-between', gap: 20, alignItems: 'center', padding: '18px 4px', borderBottom: '1px solid #202a36' };
const badgeStyle = { border: '1px solid #354153', borderRadius: 999, padding: '6px 10px', fontSize: 12, opacity: .8 };
