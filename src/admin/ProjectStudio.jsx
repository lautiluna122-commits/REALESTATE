import { useMemo, useState } from 'react';
import './project-studio.css';
import { normalizePlanImport, buildShowroomImportPreview } from '../importer/planIngestion';

const STEPS = ['Proyecto', 'Plano', 'Revisión', 'Showroom', 'Publicar'];
const ACCEPTED = ['PDF', 'PNG', 'JPG', 'JPEG', 'SVG'];

function formatSize(bytes = 0) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ProjectStudio() {
  const [step, setStep] = useState(0);
  const [projectName, setProjectName] = useState('Nuevo proyecto');
  const [developer, setDeveloper] = useState('');
  const [location, setLocation] = useState('');
  const [files, setFiles] = useState([]);
  const [plans, setPlans] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [published, setPublished] = useState(false);

  const slug = useMemo(() => projectName.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'nuevo-proyecto', [projectName]);
  const preview = useMemo(() => plans.length ? buildShowroomImportPreview(plans[0]) : null, [plans]);

  function addFiles(list) {
    const next = Array.from(list).filter((file) => ACCEPTED.includes(file.name.split('.').pop()?.toUpperCase()));
    setFiles((current) => [...current, ...next].filter((file, index, all) => all.findIndex((item) => item.name === file.name && item.size === file.size) === index));
    if (next.length) setStep(1);
  }

  function processPlan() {
    setProcessing(true);
    const normalized = files.map((file, index) => normalizePlanImport({ sourceName: file.name, page: index + 1, provenance: { source: 'browser-upload', adapter: 'plan-ingestion-v1' } }));
    window.setTimeout(() => {
      setPlans(normalized);
      setProcessing(false);
      setStep(2);
    }, 900);
  }

  function generate() {
    localStorage.setItem('realestate:project-draft', JSON.stringify({ projectName, developer, location, slug, sourceFiles: files.map(({ name, size, type }) => ({ name, size, type })), importedPlans: plans }));
    setStep(4);
  }

  return (
    <main className="studio-shell">
      <header className="studio-header">
        <div><span className="studio-kicker">REALESTATE / STUDIO</span><h1>Construí el showroom de tu proyecto.</h1><p>Un único flujo para transformar planos, inventario y contenido comercial en una experiencia inmobiliaria interactiva.</p></div>
        <a className="studio-back" href="/">Ver showroom ↗</a>
      </header>

      <nav className="studio-steps" aria-label="Progreso del proyecto">
        {STEPS.map((label, index) => <button key={label} className={index === step ? 'active' : index < step ? 'done' : ''} onClick={() => index <= step && setStep(index)}><span>{String(index + 1).padStart(2, '0')}</span>{label}</button>)}
      </nav>

      <section className="studio-card">
        {step === 0 && <>
          <div className="section-heading"><span>01 / Proyecto</span><h2>Primero definimos el proyecto.</h2><p>Estos datos serán la identidad comercial y la base del showroom.</p></div>
          <div className="field-grid"><label>Nombre del proyecto<input value={projectName} onChange={(event) => setProjectName(event.target.value)} placeholder="Ej. Ocean Mansions" /></label><label>Desarrolladora / constructora<input value={developer} onChange={(event) => setDeveloper(event.target.value)} placeholder="Nombre de la empresa" /></label><label className="wide">Ubicación<input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Punta del Este, Uruguay" /></label></div>
          <button className="primary" onClick={() => setStep(1)}>Continuar →</button>
        </>}

        {step === 1 && <>
          <div className="section-heading"><span>02 / Importación</span><h2>Cargá los planos del proyecto.</h2><p>La entrada está preparada para PDF, PNG, JPG y SVG. Podés cargar un plano por planta o un documento completo.</p></div>
          <label className={`dropzone ${dragging ? 'dragging' : ''}`} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); addFiles(event.dataTransfer.files); }}>
            <input type="file" multiple accept=".pdf,.png,.jpg,.jpeg,.svg" onChange={(event) => addFiles(event.target.files)} />
            <strong>Soltá los planos acá</strong><span>o tocá para buscar archivos</span><small>PDF · PNG · JPG · SVG</small>
          </label>
          {files.length > 0 && <div className="file-list">{files.map((file) => <div className="file-row" key={`${file.name}-${file.size}`}><div><b>{file.name}</b><small>{file.type || 'archivo'} · {formatSize(file.size)}</small></div><button onClick={() => setFiles((current) => current.filter((item) => item !== file))}>×</button></div>)}</div>}
          <div className="actions"><button className="ghost" onClick={() => setStep(0)}>← Atrás</button><button className="primary" disabled={!files.length || processing} onClick={processPlan}>{processing ? 'Procesando plano…' : 'Analizar plano →'}</button></div>
        </>}

        {step === 2 && <>
          <div className="section-heading"><span>03 / Revisión</span><h2>Antes de generar, validamos la estructura.</h2><p>La capa de ingestión ya entrega un modelo normalizado. En producción, OCR/visión/CAD puede alimentar exactamente este mismo contrato.</p></div>
          <div className="review-grid"><div className="review-preview"><div className="blueprint"><i /><i /><i /><i /><i /><i /><span>PLANTA / PREVIEW</span></div></div><div className="review-data"><div><span>Proyecto</span><b>{projectName || 'Sin nombre'}</b></div><div><span>Fuente</span><b>{files.length} archivo{files.length === 1 ? '' : 's'}</b></div><div><span>Piso detectado</span><b>{preview?.floor ?? 'Pendiente de lectura'}</b></div><div><span>Unidades detectadas</span><b>{preview?.unitsDetected?.length ?? 0}</b></div><div><span>Ambientes</span><b>{preview?.roomsDetected?.length ?? 0}</b></div><div><span>Confianza inicial</span><b>{preview?.confidence ?? 0}%</b></div><div className="review-note"><b>Control humano</b><p>La revisión es intencional: ningún plano complejo debe publicar datos comerciales sin validación. La automatización aumenta la velocidad; la revisión protege la calidad.</p></div></div></div>
          <div className="actions"><button className="ghost" onClick={() => setStep(1)}>← Volver al plano</button><button className="primary" onClick={() => setStep(3)}>Aprobar estructura →</button></div>
        </>}

        {step === 3 && <>
          <div className="section-heading"><span>04 / Generación</span><h2>El contenido ya está listo para entrar al showroom.</h2><p>El proyecto queda preparado para alimentar edificio, pisos, unidades, planos, amenities, interiores y la capa comercial.</p></div>
          <div className="generation-list">{['Edificio interactivo', 'Pisos y unidades', 'Inventario + disponibilidad', 'Planos de unidad', 'Interiores / experiencia', 'Amenities + ubicación', 'CTA de contacto'].map((item, index) => <div key={item}><span>0{index + 1}</span><b>{item}</b><em>Preparado</em></div>)}</div>
          <div className="actions"><button className="ghost" onClick={() => setStep(2)}>← Revisar</button><button className="primary" onClick={generate}>Generar showroom →</button></div>
        </>}

        {step === 4 && <>
          <div className="publish-state"><div className="publish-mark">✓</div><span>05 / Publicación</span><h2>{published ? 'Proyecto publicado.' : 'Showroom generado.'}</h2><p>{published ? 'El proyecto quedó preparado para compartir con clientes.' : 'Ya tenés una experiencia lista para revisar. El siguiente paso es publicarla con un slug propio.'}</p></div>
          <div className="url-card"><span>URL pública</span><b>realestate.app/{slug}</b><small>Slug configurable · dominio definitivo por proyecto</small></div>
          <div className="actions"><button className="ghost" onClick={() => setStep(3)}>← Volver</button><button className="primary" onClick={() => setPublished(true)}>{published ? 'Publicado ✓' : 'Publicar proyecto →'}</button></div>
        </>}
      </section>
      <footer className="studio-footer"><span>REALESTATE</span><span>Project → Data → Renderer → Experience</span></footer>
    </main>
  );
}
