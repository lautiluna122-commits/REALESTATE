export default function FloorPlan({ apartment, onClose }) {
  if (!apartment) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="plan-modal" onClick={(e) => e.stopPropagation()}>
        <div className="plan-header">
          <div>
            <p className="eyebrow">PLANO</p>
            <h3>Unidad {apartment.number}</h3>
          </div>
          <button className="close-btn" onClick={onClose}>Cerrar</button>
        </div>

        <svg viewBox="0 0 600 420" className="plan-svg" role="img" aria-label="Planta de la unidad">
          <rect x="40" y="30" width="520" height="330" rx="10" fill="#f6f1eb" stroke="#c7b8a8" strokeWidth="2" />
          <rect x="70" y="60" width="210" height="100" fill="#d9dfe3" stroke="#b7c0c6" strokeWidth="2" />
          <rect x="310" y="60" width="210" height="120" fill="#e6d3bb" stroke="#bca37f" strokeWidth="2" />
          <rect x="70" y="180" width="180" height="150" fill="#d7d7d1" stroke="#b7b5b0" strokeWidth="2" />
          <rect x="280" y="200" width="110" height="100" fill="#dfe6d9" stroke="#b5c4b2" strokeWidth="2" />
          <rect x="415" y="200" width="110" height="100" fill="#d1d8dc" stroke="#9aa7b0" strokeWidth="2" />
          <rect x="430" y="100" width="70" height="80" fill="#d7d3d0" stroke="#b7b2ae" strokeWidth="2" />

          <rect x="150" y="220" width="90" height="80" fill="#d9dfe3" stroke="#7d8a92" strokeWidth="2" />
          <rect x="410" y="230" width="80" height="60" fill="#dfe6d9" stroke="#7d8a92" strokeWidth="2" />

          <text x="160" y="110" fontSize="18" fill="#2a2a2a">Living</text>
          <text x="345" y="120" fontSize="18" fill="#2a2a2a">Cocina</text>
          <text x="95" y="247" fontSize="18" fill="#2a2a2a">Dormitorio principal</text>
          <text x="300" y="255" fontSize="18" fill="#2a2a2a">Dormitorio 2</text>
          <text x="430" y="260" fontSize="18" fill="#2a2a2a">Dormitorio 3</text>
          <text x="440" y="150" fontSize="18" fill="#2a2a2a">Baño</text>
          <text x="170" y="340" fontSize="18" fill="#2a2a2a">Terraza</text>
        </svg>
      </div>
    </div>
  );
}
