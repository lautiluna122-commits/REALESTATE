import { useEffect, useMemo, useState } from 'react';

const API = import.meta.env.VITE_API_BASE_URL || '/api';
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const ASSET_API = import.meta.env.VITE_ASSET_API_BASE_URL || (SUPABASE_URL ? `${SUPABASE_URL}/functions/v1/realestate-assets` : '/functions/v1/realestate-assets');
const AI_API = import.meta.env.VITE_AI_API_BASE_URL || (SUPABASE_URL ? `${SUPABASE_URL}/functions/v1/realestate-ai` : '/functions/v1/realestate-ai');

async function request(base, path, options = {}) {
  const isForm = options.body instanceof FormData;
  const response = await fetch(`${base}${path}`, {
    ...options,
    headers: { ...(isForm ? {} : { 'Content-Type': 'application/json' }), ...(options.headers || {}) },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || `Error ${response.status}`);
  return data;
}

const stages = ['UPLOADING', 'QUEUED', 'PROCESSING', 'REVIEW_REQUIRED', 'READY', 'APPROVED', 'FAILED'];

export default function AIIntake({ project, apiKey, act }) {
  const headers = { 'x-api-key': apiKey };
  const [jobs, setJobs] = useState([]);
  const [files, setFiles] = useState([]);
  const [kind, setKind] = useState('PROJECT_PACKAGE');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const data = await request(AI_API, `/projects/${project.id}/jobs`, { headers });
      setJobs(Array.isArray(data) ? data : []);
      setError('');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [project.id]);

  const manifestJobs = useMemo(() => jobs.filter((job) => ['PROJECT_PACKAGE', 'PLAN_EXTRACTION', 'ASSET_CLASSIFICATION'].includes(job.kind)), [jobs]);

  const submit = async (event) => {
    event.preventDefault();
    if (!files.length) return setError('Seleccioná al menos un archivo.');
    setError('');
    setBusy(true);
    try {
      const uploaded = [];
      for (const file of files) {
        const form = new FormData();
        form.append('file', file);
        form.append('kind', file.type === 'application/pdf' ? 'document' : file.type.startsWith('image/') ? 'image' : 'source');
        form.append('entityType', 'project');
        form.append('entityId', project.id);
        const result = await request(ASSET_API, `/projects/${project.id}/upload`, { method: 'POST', headers, body: form });
        uploaded.push(result.asset);
      }

      const job = await request(AI_API, `/projects/${project.id}/jobs`, {
        method: 'POST', headers,
        body: JSON.stringify({ kind, notes, sourceAssetIds: uploaded.map((asset) => asset.id), requestedBy: 'workspace-user' }),
      });

      await act(() => request(AI_API, `/projects/${project.id}/jobs/${job.id}/process`, { method: 'POST', headers }), 'Material enviado a IA');
      setFiles([]);
      setNotes('');
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const approve = (job) => act(() => request(AI_API, `/projects/${project.id}/jobs/${job.id}/approve`, {
    method: 'POST', headers,
    body: JSON.stringify({ approvedBy: 'workspace-user' }),
  }), 'Propuesta aprobada y experiencia actualizada').then(load);

  return <div className="contentGrid">
    <article className="adminPanel">
      <span className="adminKicker">AI INTAKE</span>
      <h2>Convertir material en estructura</h2>
      <p>Los archivos se guardan primero en almacenamiento privado. La IA propone; el operador aprueba antes de modificar la fuente de verdad.</p>
      <form className="formPanel" onSubmit={submit}>
        <label className="adminField"><span>Tipo de procesamiento</span><select value={kind} onChange={(e) => setKind(e.target.value)}><option value="PROJECT_PACKAGE">Paquete de proyecto</option><option value="PLAN_EXTRACTION">Lectura de planos</option><option value="ASSET_CLASSIFICATION">Clasificación de media</option></select></label>
        <label className="adminField"><span>Planos, renders y documentación</span><input type="file" multiple accept=".pdf,.png,.jpg,.jpeg,.svg,.webp,.csv,.xlsx,.glb,.gltf,.obj,.fbx" onChange={(e) => setFiles(Array.from(e.target.files || []))} /></label>
        {files.length > 0 && <div className="checkList">{files.map((file) => <div key={`${file.name}-${file.size}`}><i>✓</i>{file.name}<small>{Math.round(file.size / 1024)} KB</small></div>)}</div>}
        <label className="adminField"><span>Instrucciones / contexto</span><textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ej.: este paquete contiene planos de los pisos 1 al 12 y renders del exterior." /></label>
        <button className="adminPrimary" disabled={!files.length || loading || busy}>{busy ? 'Subiendo y procesando…' : 'Analizar material'}</button>
      </form>
      {error && <div className="adminNotice">{error}</div>}
    </article>

    <article className="adminPanel">
      <span className="adminKicker">PROCESSING QUEUE</span>
      <h2>Trabajos del proyecto</h2>
      {loading ? <p>Cargando trabajos…</p> : manifestJobs.length === 0 ? <p>No hay procesos todavía.</p> : manifestJobs.map((job) => <div className="dataRow" key={job.id} style={{ display: 'grid', gap: 4 }}><b>{job.kind}</b><span>{job.status} · {job.createdAt ? new Date(job.createdAt).toLocaleString() : 'sin fecha'}</span>{job.validationErrors?.length > 0 && <small>⚠ {job.validationErrors.length} observaciones</small>}{['REVIEW_REQUIRED', 'READY'].includes(job.status) && <button className="adminPrimary" onClick={() => approve(job)}>Aprobar propuesta</button>}{job.status === 'FAILED' && <small>El procesamiento falló. Revisá la configuración del proveedor de IA.</small>}</div>)}
      <div className="divider" />
      <span className="adminKicker">PIPELINE</span>
      <div className="checkList">{stages.map((stage) => <div key={stage}><i>{stage === 'UPLOADING' ? '✓' : '○'}</i>{stage}<small>Estado del job</small></div>)}</div>
    </article>
  </div>;
}
