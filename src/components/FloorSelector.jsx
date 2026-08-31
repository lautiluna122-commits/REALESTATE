export default function FloorSelector({ selectedFloor, onSelectFloor, onViewFullBuilding }) {
  const floors = ['PB', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

  return (
    <aside className="floor-selector">
      <div className="selector-header">
        <span>PISOS</span>
      </div>
      <button className="full-building-btn" onClick={onViewFullBuilding}>Ver edificio completo</button>
      <div className="floor-list">
        {floors.map((floorLabel, index) => {
          const floor = floorLabel === 'PB' ? 0 : Number(floorLabel);
          const active = selectedFloor === floor;

          return (
            <button
              key={floorLabel}
              className={`floor-item ${active ? 'active' : ''}`}
              onClick={() => onSelectFloor(floor)}
            >
              {floorLabel}
            </button>
          );
        })}
      </div>
    </aside>
  );
}
