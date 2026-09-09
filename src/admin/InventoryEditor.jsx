import { useEffect, useMemo, useState } from 'react';
import { platformApi } from '../platform/platformApi';

const STATUS = ['AVAILABLE', 'RESERVED', 'SOLD'];

export default function InventoryEditor() {
  const [projects, setProjects] = useState([]), [projectId, setProjectId] = useState('');
  const [units, setUnits] = useState([]), [drafts, setDrafts] = useState({});
  const [loading, setLoading] = useState(true), [saving, setSaving] = useState(null);
  const [error, setError] = useState(''), [notice, setNotice] = useState('');

  async function loadProjects() {
    setLoading(true); setError('');
    try { const result = await platformApi.getAdminProjects(); setProjects(Array.isArray(result) ? result : []); if (!projectId && result?.[0]) setProjectId(result[0].id); }
    catch (err) { setError(err?.message || 'No se pudieron cargar los proyectos.'); } finally { setLoading(false); }
  }
  async function loadUnits(id = projectId) {
    if (!id) return; setLoading(true); setError('');
    try { const result = await platformApi.getProjectUnitsAdmin(id); const next = Array.isArray(result) ? result : []; setUnits(next); setDrafts(Object.fromEntries(next.map((u) => [u.id, { price: u.price ?? 0, status: u.status ?? 'AVAILABLE', description: u.description ?? '' }]))); }
    catch (err) { setError(err?.message || 'No se pudo cargar el inventario.'); } finally { setLoading(false); }
  }
  useEffect(() => { loadProjects(); }, []);
  useEffect(() => { if (projectId) loadUnits(projectId); }, [projectId]);
  const selected = projects.find((p) => p.id === projectId);
  const dirty = useMemo(() => units.filter((u) => { const d = drafts[u.id]; return d && (Number(d.price) !== Number(u.price) || d.status !== u.status || (d.description ?? '') !== (u.description ?? '')); }), [units, drafts]);
  const patch = (id, field, value) => { setNotice(''); setDrafts((current) => ({ ...current, [id]: { ...current[id], [field]: field === 'price' ? Number(value) : value } })); };
  async function save(unit) {
    const draft = drafts[unit.id]; if (!draft) return; setSaving(unit.id); setError(''); setNotice('');
    try { const updated = await platformApi.updateProjectUnit(projectId, unit.id, draft); setUnits((current) => current.map((u) => u.id === unit.id ? updated : u)); setDrafts((current) => ({ ...current, [unit.id]: { price: updated.price, status: updated.status, description: updated.description ?? '' } })); setNotice(`Unidad ${updated.number} actualizada correctamente.`); }
    catch (err) { setError(err?.message || 'No se pudo actualizar la unidad.'); } finally { setSaving(null); }
  }

  return <main style={{ minHeight:'100vh', background:'#080c12', color:'#f4f5f7', padding:32, fontFamily:'Inter,system-ui,sans-serif' }}>
    <header style={{ maxWidth:1280, margin:'0 auto 28px', display:'flex', justifyContent:'space-between', gap:24, alignItems:'end' }}><div><small style={{letterSpacing:'.16em',opacity:.55}}>REALESTATE / DATA STUDIO</small><h1 style={{fontSize:38,margin:'8px 0'}}>Inventario maestro</h1><p style={{opacity:.65,margin:0}}>Editar precio, disponibilidad y descripción. Los cambios se escriben en el backend.</p></div><div style={{display:'flex',gap:10}}><a href="/admin/structure" style={linkStyle}>← Estructura</a><a href="/admin" style={linkStyle}>Dashboard</a></div></header>
    <section style={panelStyle}><label style={{display:'grid',gap:7,maxWidth:420}}>Proyecto<select value={projectId} onChange={(e)=>setProjectId(e.target.value)} style={inputStyle}>{projects.map((p)=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label><div style={{marginTop:20,display:'flex',gap:22,opacity:.75}}><span>{units.length} unidades</span><span>{units.filter(u=>u.status==='AVAILABLE').length} disponibles</span><span>{units.filter(u=>u.status==='RESERVED').length} reservadas</span><span>{dirty.length} cambios pendientes</span></div></section>
    {error && <div style={{...alertStyle,borderColor:'#8f4545'}}>⚠ {error}</div>}{notice && <div style={{...alertStyle,borderColor:'#456f58'}}>✓ {notice}</div>}
    {loading ? <div style={emptyStyle}>Cargando inventario…</div> : !selected ? <div style={emptyStyle}>Seleccioná un proyecto.</div> : <section style={{...panelStyle,overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse',minWidth:900}}><thead><tr>{['Unidad','Piso','Superficie','Dorm.','Baños','Precio USD','Estado','Descripción',''].map(h=><th key={h} style={thStyle}>{h}</th>)}</tr></thead><tbody>{units.map(unit=>{const d=drafts[unit.id]||{};const isDirty=dirty.some(u=>u.id===unit.id);return <tr key={unit.id}><td style={tdStyle}><strong>{unit.number||unit.id}</strong></td><td style={tdStyle}>{unit.floor??unit.floorId??'—'}</td><td style={tdStyle}>{unit.surface??0} m²</td><td style={tdStyle}>{unit.bedrooms??0}</td><td style={tdStyle}>{unit.bathrooms??0}</td><td style={tdStyle}><input type="number" value={d.price??0} onChange={e=>patch(unit.id,'price',e.target.value)} style={inputStyle}/></td><td style={tdStyle}><select value={d.status??'AVAILABLE'} onChange={e=>patch(unit.id,'status',e.target.value)} style={inputStyle}>{STATUS.map(s=><option key={s}>{s}</option>)}</select></td><td style={tdStyle}><input value={d.description??''} onChange={e=>patch(unit.id,'description',e.target.value)} placeholder="Descripción" style={{...inputStyle,minWidth:220}}/></td><td style={tdStyle}><button disabled={!isDirty||saving===unit.id} onClick={()=>save(unit)} style={{...buttonStyle,opacity:isDirty?1:.35}}>{saving===unit.id?'Guardando…':'Guardar'}</button></td></tr>})}</tbody></table>{!units.length&&<div style={emptyStyle}>Este proyecto todavía no tiene unidades.</div>}</section>}
  </main>;
}
const linkStyle={color:'#f4f5f7',textDecoration:'none',border:'1px solid #2b3440',borderRadius:10,padding:'10px 14px'};
const panelStyle={maxWidth:1280,margin:'0 auto 18px',background:'#0e141d',border:'1px solid #202a36',borderRadius:16,padding:20};
const inputStyle={background:'#080c12',color:'#f4f5f7',border:'1px solid #303b49',borderRadius:8,padding:'9px 10px'};
const buttonStyle={background:'#f4f5f7',color:'#080c12',border:0,borderRadius:8,padding:'9px 13px',cursor:'pointer',fontWeight:700};
const thStyle={textAlign:'left',padding:'12px 10px',borderBottom:'1px solid #28313c',fontSize:12,opacity:.55,whiteSpace:'nowrap'};
const tdStyle={padding:'12px 10px',borderBottom:'1px solid #1c2530',fontSize:14,whiteSpace:'nowrap'};
const alertStyle={maxWidth:1280,margin:'0 auto 18px',background:'#0e141d',border:'1px solid',borderRadius:12,padding:14};
const emptyStyle={maxWidth:1280,margin:'24px auto',opacity:.6,padding:30};
