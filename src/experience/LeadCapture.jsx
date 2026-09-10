import { useState } from 'react';
import { getProjectById, getProjectUnits } from '../platform/projectRegistry';

export default function LeadCapture({ projectId }) {
  const project = getProjectById(projectId);
  const units = getProjectUnits(projectId);
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', unitId: '', message: '' });

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    try {
      const response = await fetch(`/api/projects/${project.id}/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, unitId: form.unitId || null }),
      });
      if (!response.ok) throw new Error('No se pudo enviar la consulta');
      setSent(true);
      setForm({ name: '', email: '', phone: '', unitId: '', message: '' });
    } catch (error) {
      window.alert(error.message);
    } finally {
      setBusy(false);
    }
  }

  if (!project) return null;

  return (
    <>
      <button type="button" onClick={() => { setOpen(true); setSent(false); }} style={{ position: 'fixed', right: 24, bottom: 24, zIndex: 50, border: 0, borderRadius: 999, padding: '15px 22px', background: '#e2b85f', color: '#101516', fontWeight: 700, letterSpacing: '.04em', boxShadow: '0 14px 40px rgba(0,0,0,.3)', cursor: 'pointer' }}>
        Consultar proyecto ↗
      </button>

      {open && (
        <div role="dialog" aria-modal="true" aria-label="Consultar proyecto" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }} style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'grid', placeItems: 'center', padding: 20, background: 'rgba(3,8,9,.72)', backdropFilter: 'blur(12px)' }}>
          <form onSubmit={submit} style={{ width: 'min(560px, 100%)', maxHeight: '90vh', overflow: 'auto', padding: 30, border: '1px solid rgba(255,255,255,.12)', borderRadius: 20, background: '#101719', color: '#f5f1e9', boxShadow: '0 30px 100px rgba(0,0,0,.45)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20, alignItems: 'start' }}>
              <div><small style={{ opacity: .55, letterSpacing: '.16em' }}>CONTACTO / {project.name.toUpperCase()}</small><h2 style={{ margin: '10px 0 6px', fontSize: 32, fontWeight: 400 }}>Hablemos de tu unidad.</h2><p style={{ marginTop: 0, opacity: .65 }}>Dejanos tus datos y el equipo comercial se pondrá en contacto.</p></div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Cerrar" style={{ border: 0, background: 'transparent', color: 'white', fontSize: 28, cursor: 'pointer' }}>×</button>
            </div>
            {sent ? (
              <div style={{ marginTop: 28, padding: 22, borderRadius: 14, background: 'rgba(226,184,95,.1)', border: '1px solid rgba(226,184,95,.25)' }}><strong>Consulta recibida.</strong><p style={{ opacity: .7, marginBottom: 0 }}>Gracias. El equipo comercial de {project.name} se pondrá en contacto.</p></div>
            ) : (
              <div style={{ display: 'grid', gap: 12, marginTop: 22 }}>
                <input required minLength={2} placeholder="Nombre y apellido" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} style={fieldStyle} />
                <input required type="email" placeholder="Email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} style={fieldStyle} />
                <input placeholder="Teléfono" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} style={fieldStyle} />
                <select value={form.unitId} onChange={(event) => setForm({ ...form, unitId: event.target.value })} style={fieldStyle}><option value="">Me interesa conocer unidades</option>{units.filter((unit) => unit.status !== 'SOLD').map((unit) => <option key={unit.id} value={unit.id}>Unidad {unit.number} · Piso {unit.floor} · {unit.surface} m²</option>)}</select>
                <textarea rows={4} placeholder="Mensaje (opcional)" value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} style={{ ...fieldStyle, resize: 'vertical' }} />
                <button disabled={busy} type="submit" style={{ marginTop: 6, border: 0, borderRadius: 10, padding: 15, background: '#e2b85f', color: '#101516', fontWeight: 700, cursor: busy ? 'wait' : 'pointer' }}>{busy ? 'Enviando…' : 'Enviar consulta ↗'}</button>
              </div>
            )}
          </form>
        </div>
      )}
    </>
  );
}

const fieldStyle = { width: '100%', boxSizing: 'border-box', padding: '13px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,.12)', background: '#182123', color: '#f5f1e9', outline: 'none', font: 'inherit' };
