export default function ApartmentInfo({ apartment, onClose, onViewPlan, onExploreUnit }) {
  if (!apartment) return null;

  const statusClass = apartment.status.toLowerCase().replace(/\s+/g, '-');

  return (
    <aside className="info-panel">
      <div className="panel-topbar">
        <div>
          <p className="eyebrow">PROYECTO</p>
          <h3>SLS Residences — Demo</h3>
        </div>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>

      <div className="info-block">
        <p className="eyebrow">UNIDAD</p>
        <h2>{apartment.number}</h2>
      </div>

      <div className="info-grid">
        <div><span>PISO</span><strong>{apartment.floor}</strong></div>
        <div><span>TIPOLOGÍA</span><strong>{apartment.type}</strong></div>
        <div><span>SUPERFICIE</span><strong>{apartment.area} m²</strong></div>
        <div><span>TERRAZA</span><strong>{apartment.terrace} m²</strong></div>
        <div><span>BAÑOS</span><strong>{apartment.bathrooms}</strong></div>
        <div><span>PRECIO</span><strong>USD {apartment.price.toLocaleString()}</strong></div>
        <div><span>ESTADO</span><strong className={`status-pill ${statusClass}`}>{apartment.status}</strong></div>
      </div>

      <div className="action-row">
        <button className="primary" onClick={onViewPlan}>VER PLANO</button>
        <button className="secondary" onClick={onExploreUnit}>EXPLORAR UNIDAD</button>
      </div>

      <button className="ghost" onClick={onClose}>CONSULTAR</button>
    </aside>
  );
}
