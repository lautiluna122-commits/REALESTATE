import { useMemo, useState } from 'react';
import './project-studio.css';
import { normalizePlanImport, buildShowroomImportPreview } from '../importer/planIngestion';
import { createProjectAsset } from '../domain/projectAssetModels';
import { createShowroomManifest } from '../domain/showroomManifest';

const STEPS = ['Proyecto', 'Contenido', 'Revisión', 'Showroom', 'Publicar'];
const ACCEPTED = ['PDF', 'PNG', 'JPG', 'JPEG', 'SVG', 'GLB', 'GLTF', 'FBX', 'OBJ', 'WEBP', 'MP4', 'WEBM', 'MOV'];

function formatSize(bytes = 0) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function classifyFile(file) {
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (['glb', 'gltf', 'fbx', 'obj'].includes(ext)) return 'buildingModel';
  if (['pdf', 'png', 'jpg', 'jpeg', 'svg'].includes(ext)) return 'plan';
  if (['mp4', 'webm', 'mov'].includes(ext)) return 'video';
  return 'exteriorRender';
}

export default function ProjectStudio() {
  const [step, setStep] = useState(0);
  const [projectName, setProjectName] = useState('Nuevo proyecto');
  const [developer, setDeveloper] = useState('');
  const [location, setLocation] = useState('');
  const [files, setFiles] = useState([]);
  const [plans, setPlans] = useState([]);
  const [assets, setAssets] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [published, setPublished] = useState(false);

  const slug = useMemo(() => projectName.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'nuevo-proyecto', [projectName]);
  const preview = useMemo(() => plans.length ? buildShowroomImportPreview(plans[0]) : null, [plans]);
  const counts = useMemo(() => files.reduce((acc, file) => { const kind = classifyFile(file); acc[kind] = (acc[kind] ?? 0) + 1; return acc; }, {}), [files]);

  function addFiles(list) {
    const next = Array.from(list).filter((file) => ACCEPTED.includes(file.name.split('.').pop()?.toUpperCase()));
    setFiles((current) => [...current, ...next].filter((file, index, all) => all.findIndex((item) => item.name === file.name && item.size === file.size) === index));
    if (next.length) setStep(1);
  }

  function removeFile(file) {
    setFiles((current) => current.filter((item) => item !== file));
  }

  function processContent() {
    setProcessing(true);
    const nextPlans = files.filter((file) => classifyFile(file) === 'plan').map((file, index) => normalizePlanImport({
      sourceName: file.name,
      page: index + 1,
      provenance: { source: 'browser-upload', adapter: 'plan-ingestion-v1' },
    }));
    const nextAssets = files.map((file) => createProjectAsset({
      projectId: slug,
      name: file.name,
      kind: classifyFile(file),
      path: '',
      source: 'upload',
      status: 'PENDING',
      mimeType: file.type,
      size: file.size,
      metadata: { originalName: file.name, extension: file.name.split('.').pop()?.toLowerCase() },
    }));
    window.setTimeout(() => {
      setPlans(nextPlans);
      setAssets(nextAssets);
      setProcessing(false);
      setStep(2);
    }, 500);
  }

  function generate() {
    const project = {
      id: slug,
      name: projectName,
      slug,
      companyId: developer,
      location: { name: location },
      units: [],
      config: { source: 'project-studio', generation: 'showroom-manifest-v1' },
    };
    const manifest = createShowroomManifest({ project, importedPlans: plans, assets });
    localStorage.setItem('realestate:project-draft', JSON.stringify({ projectName, developer, location, slug, sourceFiles: files.map(({ name, size, type }) => ({ name, size, type })), importedPlans: plans, assets, showroomManifest: manifest }));
    localStorage.setItem(`realestate:project:${slug}`, JSON.stringify(manifest));
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
          <div className="section-heading"><span>01 / Proyecto</span><h2>Primero definimos el proyecto.</h2><p>Estos datos son la identidad comercial y la base de todo lo que se genere después.</p></div>
          <div className="field-grid"><label>Nombre del proyecto<input value={projectName} onChange={(event) => setProjectName(event.target.value)} placeholder="Ej. Ocean Mansions" /></label><label>Desarrolladora / constructora<input value={developer} onChange={(event) => setDeveloper(event.target.value)} placeholder="Nombre de la empresa" /></label><label className="wide">Ubicación<input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Punta del Este, Uruguay" /></label></div>
          <button className="primary" onClick={() => setStep(1)}>Continuar →</button>
        </>}

        {step === 1 && <>
          <div className="section-heading"><span>02 / Contenido</span><h2>Cargá todo lo que tenga el proyecto.</h2><p>Planos, modelo 3D, renders, interiores, videos y panoramas entran por el mismo pipeline. El renderer queda desacoplado de los archivos originales.</p></div>
          <label className={`dropzone ${dragging ? 'dragging' : ''}`} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); addFiles(event.dataTransfer.files); }}>
            <input type="file" multiple accept=".pdf,.png,.jpg,.jpeg,.svg,.glb,.gltf,.fbx,.obj,.webp,.mp4,.webm,.mov" onChange={(event) => addFiles(event.target.files)} />
            <strong>Soltá los archivos del proyecto acá</strong><span>planos · 3D · renders · videos</span><small>PDF · PNG · JPG · SVG · GLB · GLTF · FBX · OBJ · WEBP · MP4 · WEBM</small>
          </label>
          {files.length > 0 && <>
            <div className="file-list">{files.map((file) => <div className="file-row" key={`${file.name}-${file.size}`}><div><b>{file.name}</b><small>{classifyFile(file)} · {file.type || 'archivo'} · {formatSize(file.size)}</small></div><button aria-label={`Quitar ${file.name}`} onClick={() => removeFile(file)}>×</button></div>)}</div>
            <div className="review-note"><b>{files.length} archivos preparados</b><p>{counts.buildingModel ?? 0} modelo(s) 3D · {counts.plan ?? 0} plano(s) · {(counts.exteriorRender ?? 0)} render(s) · {counts.video ?? 0} video(s). La estructura acepta más contenido después sin cambiar el showroom.</p></div>
          </>}
          <div className="actions"><button className="ghost" onClick={() => setStep(0)}>← Atrás</button><button className="primary" disabled={!files.length || processing} onClick={processContent}>{processing ? 'Preparando contenido…' : 'Analizar contenido →'}</button></div>
        </>}

        {step === 2 && <>
          <div className="section-heading"><span>03 / Revisión</span><h2>Validamos antes de generar.</h2><p>El importador normaliza la información para que OCR, visión artificial o CAD puedan conectarse después sin tocar la experiencia 3D.</p></div>
          <div className="review-grid"><div className="review-preview"><div className="blueprint"><i /><i /><i /><i /><i /><i /><span>{plans.length ? 'PLANTA / ESTRUCTURA' : 'CONTENIDO / PREVIEW'}</span></div></div><div className="review-data"><div><span>Proyecto</span><b>{projectName || 'Sin nombre'}</b></div><div><span>Contenido</span><b>{files.length} archivo{files.length === 1 ? '' : 's'}</b></div><div><span>Planos</span><b>{plans.length}</b></div><div><span>Piso detectado</span><b>{preview?.floor ?? 'Pendiente de lectura'}</b></div><div><span>Unidades detectadas</span><b>{preview?.unitsDetected?.length ?? 0}</b></div><div><span>Ambientes</span><b>{preview?.roomsDetected?.length ?? 0}</b></div><div><span>Confianza inicial</span><b>{preview?.confidence ?? 0}%</b></div><div className="review-note"><b>Control humano</b><p>La automatización prepara y estructura; la publicación final debe validar unidades, superficies, precios y correspondencia con planos/renders.</p></div></div></div>
          <div className="actions"><button className="ghost" onClick={() => setStep(1)}>← Volver al contenido</button><button className="primary" onClick={() => setStep(3)}>Aprobar estructura →</button></div>
        </>}

        {step === 3 && <>
          <div className="section-heading"><span>04 / Generación</span><h2>La experiencia se construye por capas.</h2><p>El manifest ya define cómo pasar de contenido real a showroom y cuál es el fallback si todavía falta un asset.</p></div>
          <div className="generation-list">{['Edificio interactivo', 'Pisos y unidades', 'Inventario + disponibilidad', 'Planos de unidad', 'Interiores / experiencia', 'Amenities + ubicación', 'CTA de contacto'].map((item, index) => <div key={item}><span>0{index + 1}</span><b>{item}</b><em>En pipeline</em></div>)}</div>
          <div className="review-note"><b>Fallback del renderer</b><p>Modelo 3D → renders/media → geometría procedural. Así un proyecto puede empezar con planos y contenido comercial y sumar un GLB final sin rehacer la plataforma.</p></div>
          <div className="actions"><button className="ghost" onClick={() => setStep(2)}>← Revisar</button><button className="primary" onClick={generate}>Generar showroom →</button></div>
        </>}

        {step === 4 && <>
          <div className="publish-state"><div className="publish-mark">✓</div><span>05 / Publicación</span><h2>{published ? 'Proyecto publicado.' : 'Showroom generado.'}</h2><p>{published ? 'El proyecto quedó marcado para publicación.' : 'El proyecto ya tiene un manifest persistido en el navegador y una ruta pública preparada.'}</p></div>
          <div className="url-card"><span>Ruta pública preparada</span><b>/proyecto/{slug}</b><small>La URL será real cuando el proyecto esté desplegado en un dominio. No se muestra una URL inventada.</small></div>
          <div className="actions"><button className="ghost" onClick={() => setStep(3)}>← Volver</button><a className="primary" href={`/proyecto/${slug}`}>Abrir showroom →</a><button className="primary" onClick={() => setPublished(true)}>{published ? 'Publicado ✓' : 'Publicar proyecto →'}</button></div>
        </>}
      </section>
      <footer className="studio-footer"><span>REALESTATE</span><span>Project → Data → Import → Map → Renderer → Experience → Publish</span></footer>
    </main>
  );
}
