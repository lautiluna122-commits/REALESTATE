export default function UIOverlay({ selectedFloor, selectedApartment, onSelectFloor, onViewFullBuilding }) {
  return (
    <div className="ui-overlay">
      <header className="topbar">
        <div>
          <div className="brand">REAL ESTATE 3D</div>
          <div className="subtitle">Digital Property Experience</div>
        </div>
        <div className="top-actions">
          <span>EDIFICIO</span>
          <span>PISOS</span>
          <span>UNIDADES</span>
          <span>PLANO</span>
          <span>ENTORNO</span>
        </div>
      </header>

      <div className="hud-panel">
        <span>ROTAR • ZOOM • SELECCIONAR</span>
      </div>
    </div>
  );
}
