import { useEffect, useMemo, useState } from 'react';

const API = import.meta.env.VITE_API_BASE_URL || '/api';

async function request(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || `Error ${response.status}`);
  return data;
}

const stages = ['QUEUED', 'PROCESSING', 'REVIEW_REQUIRED', 'READY', 'APPROVED', 'FAILED'];

export default function AIIntake({ project, apiKey, act }) {
  const headers = { 'x-api-key': apiKey };
  const [jobs, setJobs] = useState([]);
  const [files, setFiles] = useState([]);
  const [kind, setKind] = useState('PROJECT_PACKAGE');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const data = await request(`/admin/projects/${project.id}/ai/jobs`, { headers });
      setJobs(Array.isArray(data) ? data : []);
      setError('');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [project.id]);

  const manifestJobs = useMemo(() => jobs.filter((job) => job.kind === 'PROJECT_PACKAGE' || job.kind === 'PLAN_EXTRACTION'), [jobs]);

  const submit = async (event) => {
    event.preventDefault();
    if (!files.length) return setError('Seleccioná al menos un archivo.');
    setError('');
    try {
      const inputManifest = files.map((file) => ({ name: file.name, type: file.type, size: file.size }));
      await act(() => request(`/admin/projects/${project.id}/ai/jobs`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ kind, inputManifest, notes, sourceAssetIds: [] }),
      }), 'Procesamiento IA iniciado');
      setFiles([]);
      setNotes('');
      await load();
    } catch (e) {
      setError(e.message);
    }
  };

  const approve = (job) => act(() => request(`/admin/projects/${project.id}/ai/jobs/${job.id}/approve`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ approvedBy: 'workspace-user' }),
  }), 'Propuesta aprobada');

  return <div className="contentGrid">
    <article className="adminPanel">
      <span className="adminKicker">AI INTAKE</span>
      <h2>Convertir material en estructura</h2>
      <p>La IA propone. El operador revisa. La fuente de verdad solo cambia después de aprobar.</p>
      <form className="formPanel" onSubmit={submit}>
        <label className="adminField"><span>Tipo de procesamiento</span><select value={kind} onChange={(e) => setKind(e.target.value)}><option value="PROJECT_PACKAGE">Paquete de proyecto</option><option value="PLAN_EXTRACTION">Lectura de planos</option><option value="ASSET_CLASSIFICATION">Clasificación de media</option></select></label>
        <label className="adminField"><span>Planos, renders y documentación</span><input type="file" multiple accept=".pdf,.png,.jpg,.jpeg,.svg,.webp,.csv,.xlsx,.glb,.gltf,.obj,.fbx" onChange={(e) => setFiles(Array.from(e.target.files || []))} /></label>
        {files.length > 0 && <div className="checkList">{files.map((file) => <div key={`${file.name}-${file.size}`}><i>✓</i>{file.name}<small>{Math.round(file.size / 1024)} KB</small></div>)}</div>}
        <label className="adminField"><span>Instrucciones / contexto</span><textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ej.: este paquete contiene planos de los pisos 1 al 12 y renders del exterior." /></label>
        <button className="adminPrimary" disabled={!files.length || loading}>Analizar material</button>
      </form>
      {error && <div className="adminNotice">{error}</div>}
    </article>

    <article className="adminPanel">
      <span className="adminKicker">PROCESSING QUEUE</span>
      <h2>Trabajos del proyecto</h2>
      {loading ? <p>Cargando trabajos…</p> : manifestJobs.length === 0 ? <p>No hay procesos todavía.</p> : manifestJobs.map((job) => <div className="dataRow" key={job.id} style={{ display: 'grid', gap: 4 }}><b>{job.kind}</b><span>{job.status} · {job.createdAt ? new Date(job.createdAt).toLocaleString() : 'sin fecha'}</span>{job.validationErrors?.length > 0 && <small>⚠ {job.validationErrors.length} observaciones</small>}{['REVIEW_REQUIRED', 'READY'].includes(job.status) && <button className="adminPrimary" onClick={() => approve(job)}>Aprobar propuesta</button>}</div>)}
      <div className="divider" />
      <span className="adminKicker">PIPELINE</span>
      <div className="checkList">{stages.map((stage, index) => <div key={stage}><i>{index < 2 ? '✓' : '○'}</i>{stage}<small>{index < 2 ? 'Preparado' : 'Pendiente según job'}</small></div>)}</div>
    </article>
  </div>;
}
