import { Canvas } from '@react-three/fiber';
import { ContactShadows, Environment, Float, OrbitControls, RoundedBox, Sky } from '@react-three/drei';
import { useMemo, useState } from 'react';
import { getProjectById } from '../platform/projectRegistry';
import { STATUS_LABELS } from '../domain/platformModels';

const project = getProjectById();
const units = project.units ?? [];
const floors = [...new Set(units.map((unit) => unit.floor))].sort((a, b) => a - b);
const available = units.filter((unit) => unit.status === 'AVAILABLE').length;
const reserved = units.filter((unit) => unit.status === 'RESERVED').length;
const sold = units.filter((unit) => unit.status === 'SOLD').length;
const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

function statusLabel(status) {
  return STATUS_LABELS[status] ?? status;
}

function statusColor(status, selected = false) {
  if (selected) return '#d9b66b';
  if (status === 'AVAILABLE') return '#b8ddcf';
  if (status === 'RESERVED') return '#e4c985';
  return '#d9a8a8';
}

function Window({ x, y, z, sx = 1, sy = 1, front = true, night }) {
  return (
    <mesh position={[x, y, z]}>
      <boxGeometry args={[1.05 * sx, 1.55 * sy, 0.06]} />
      <meshStandardMaterial color={night ? '#d8c38e' : '#9fc4d6'} emissive={night ? '#c89236' : '#1d4d65'} emissiveIntensity={night ? 1.2 : 0.08} roughness={0.16} metalness={0.65} />
    </mesh>
  );
}

function Tower({ selectedFloor, selectedUnit, onSelectUnit, night }) {
  const visibleFloors = selectedFloor == null ? floors : floors.filter((floor) => floor === selectedFloor);
  return (
    <group position={[0, 0, 0]}>
      <RoundedBox args={[13.8, 3.1, 9.4]} radius={0.25} smoothness={4} position={[0, 1.65, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#d7d5d0" roughness={0.62} metalness={0.2} />
      </RoundedBox>
      <RoundedBox args={[11.8, 1.2, 10.1]} radius={0.18} smoothness={3} position={[0, 3.45, 0]} castShadow>
        <meshStandardMaterial color="#e5e1da" roughness={0.52} metalness={0.18} />
      </RoundedBox>
      <mesh position={[0, 1.4, 4.72]}>
        <boxGeometry args={[7.2, 2.5, 0.16]} />
        <meshStandardMaterial color="#8eaaa9" roughness={0.18} metalness={0.5} transparent opacity={0.82} />
      </mesh>
      {visibleFloors.map((floor) => {
        const y = 4.1 + (floor - 1) * 2.25;
        const floorUnits = units.filter((unit) => unit.floor === floor);
        return (
          <group key={floor} position={[0, y, 0]}>
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[14.5, 0.14, 10]} />
              <meshStandardMaterial color="#b6b0a8" roughness={0.8} />
            </mesh>
            {floorUnits.map((unit, index) => {
              const x = -4.9 + (index % 4) * 3.25;
              const selected = selectedUnit?.id === unit.id;
              return (
                <group key={unit.id} position={[x, 0.7, 4.58]}>
                  <mesh onClick={(event) => { event.stopPropagation(); onSelectUnit(unit); }} onPointerOver={() => { document.body.style.cursor = 'pointer'; }} onPointerOut={() => { document.body.style.cursor = 'default'; }} castShadow>
                    <boxGeometry args={[2.55, 1.45, 0.32]} />
                    <meshStandardMaterial color={statusColor(unit.status, selected)} emissive={selected ? '#7b5c1c' : '#000'} emissiveIntensity={selected ? 0.7 : 0.05} roughness={0.52} metalness={0.25} />
                  </mesh>
                  <Window x={0} y={0.12} z={0.18} sx={1.65} sy={0.58} night={night} />
                  <mesh position={[0, -0.72, 0.18]}>
                    <boxGeometry args={[2.75, 0.12, 1.25]} />
                    <meshStandardMaterial color="#c8bba7" roughness={0.8} />
                  </mesh>
                </group>
              );
            })}
            {Array.from({ length: 4 }).map((_, i) => (
              <Window key={i} x={-4.8 + i * 3.2} y={0.72} z={-4.75} sx={1.4} sy={0.72} night={night} />
            ))}
          </group>
        );
      })}
      <RoundedBox args={[16, 1.05, 11]} radius={0.2} smoothness={3} position={[0, 2.1, 0]} castShadow>
        <meshStandardMaterial color="#c9c2b8" roughness={0.72} />
      </RoundedBox>
      <mesh position={[0, 2.7, 4.82]}>
        <boxGeometry args={[4.4, 2.0, 0.25]} />
        <meshStandardMaterial color="#607c7e" metalness={0.55} roughness={0.22} />
      </mesh>
      <RoundedBox args={[17, 0.5, 12]} radius={0.16} smoothness={3} position={[0, 0.25, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#c8b9a8" roughness={0.8} />
      </RoundedBox>
      <mesh position={[0, 0.58, 5.8]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[8, 2.5]} />
        <meshStandardMaterial color="#9ab6b0" roughness={0.3} metalness={0.1} />
      </mesh>
    </group>
  );
}

function Palm({ position, scale = 1 }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 1.1, 0]} castShadow><cylinderGeometry args={[0.11, 0.18, 2.2, 10]} /><meshStandardMaterial color="#79563b" roughness={0.9} /></mesh>
      {Array.from({ length: 7 }).map((_, i) => <mesh key={i} position={[Math.sin(i) * 0.28, 2.15, Math.cos(i) * 0.28]} rotation={[0.25 * Math.cos(i), i * 0.9, 0.5]}><coneGeometry args={[0.22, 1.8, 7]} /><meshStandardMaterial color="#3e7754" roughness={0.9} /></mesh>)}
    </group>
  );
}

function Scene({ selectedFloor, selectedUnit, onSelectUnit, night }) {
  return (
    <Canvas shadows camera={{ position: [23, 17, 28], fov: 38 }} dpr={[1, 1.6]} gl={{ antialias: true }}>
      <color attach="background" args={[night ? '#0d1823' : '#b8d3df']} />
      <fog attach="fog" args={[night ? '#0d1823' : '#b8d3df', 35, 75]} />
      <ambientLight intensity={night ? 0.62 : 1.25} />
      <directionalLight castShadow position={[12, 28, 18]} intensity={night ? 1.05 : 2.4} color={night ? '#d9b783' : '#fff3d8'} shadow-mapSize-width={2048} shadow-mapSize-height={2048} />
      <Environment preset="city" />
      <Sky distance={450000} sunPosition={night ? [-4, -1, 3] : [8, 8, 4]} inclination={night ? 0.75 : 0.52} azimuth={0.2} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow><planeGeometry args={[120, 120]} /><meshStandardMaterial color={night ? '#1c2a2b' : '#dbe4d4'} roughness={1} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 22]} receiveShadow><planeGeometry args={[42, 12]} /><meshStandardMaterial color="#aaa9a4" roughness={0.92} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 30]}><planeGeometry args={[42, 8]} /><meshStandardMaterial color="#93aeb7" roughness={0.6} /></mesh>
      <Palm position={[-13, 0, 13]} scale={1.25} /><Palm position={[13, 0, 12]} scale={1.15} /><Palm position={[-17, 0, -7]} /><Palm position={[17, 0, -4]} />
      <Tower selectedFloor={selectedFloor} selectedUnit={selectedUnit} onSelectUnit={onSelectUnit} night={night} />
      <ContactShadows position={[0, -0.02, 0]} opacity={0.38} scale={55} blur={2} far={30} />
      <OrbitControls makeDefault enableDamping dampingFactor={0.07} minDistance={16} maxDistance={52} maxPolarAngle={Math.PI / 2.03} target={[0, 9, 2]} />
    </Canvas>
  );
}

function UnitCard({ unit, onPlan, onClose }) {
  if (!unit) return null;
  return <aside className="unit-detail">
    <button className="icon-close" onClick={onClose}>×</button>
    <div className="unit-kicker">UNIDAD {unit.number}</div>
    <h2>{unit.type}</h2>
    <div className={`availability ${unit.status.toLowerCase()}`}>{statusLabel(unit.status)}</div>
    <div className="unit-price">{money.format(unit.price)}</div>
    <div className="unit-metrics"><span><b>{unit.area} m²</b> superficie</span><span><b>{unit.terrace} m²</b> terraza</span><span><b>{unit.bedrooms}</b> dormitorios</span><span><b>{unit.bathrooms}</b> baños</span></div>
    <p>{unit.description}</p>
    <div className="unit-actions"><button className="btn-dark" onClick={onPlan}>Ver plano</button><button className="btn-outline" onClick={() => window.open('https://wa.me/?text=Hola%2C%20quiero%20consultar%20por%20la%20unidad%20'+unit.number, '_blank')}>Consultar</button></div>
  </aside>;
}

function PlanModal({ unit, onClose }) {
  if (!unit) return null;
  return <div className="modal" onClick={onClose}><div className="plan-modal" onClick={(event) => event.stopPropagation()}><div className="modal-head"><div><span>PLANO COMERCIAL</span><h3>Unidad {unit.number}</h3></div><button className="icon-close" onClick={onClose}>×</button></div><svg viewBox="0 0 700 430" className="plan-art"><rect x="28" y="28" width="644" height="374" rx="18" fill="#f4efe7" stroke="#b8aa96" strokeWidth="3"/><rect x="55" y="55" width="250" height="145" fill="#d8e4e6" stroke="#a7b7b9" strokeWidth="3"/><rect x="325" y="55" width="315" height="105" fill="#eadbc5" stroke="#c8b18f" strokeWidth="3"/><rect x="55" y="220" width="180" height="155" fill="#e2ddd5" stroke="#b9afa1" strokeWidth="3"/><rect x="255" y="220" width="170" height="155" fill="#dce6da" stroke="#aebdac" strokeWidth="3"/><rect x="445" y="185" width="195" height="190" fill="#d8e0e5" stroke="#a8b5be" strokeWidth="3"/><text x="120" y="135" fontSize="24" fill="#23313a">Living / Comedor</text><text x="410" y="118" fontSize="24" fill="#4b4032">Cocina</text><text x="86" y="300" fontSize="20" fill="#3b3935">Dormitorio</text><text x="286" y="300" fontSize="20" fill="#3b3935">Dormitorio</text><text x="500" y="275" fontSize="20" fill="#3b3935">Suite</text><text x="520" y="330" fontSize="20" fill="#3b3935">Baños</text><text x="265" y="397" fontSize="18" fill="#6b6258">Terraza · {unit.terrace} m²</text></svg></div></div>;
}

export default function ShowroomExperience() {
  const [selectedFloor, setSelectedFloor] = useState(null);
  const [selectedUnit, setSelectedUnit] = useState(units.find((unit) => unit.id === '804') ?? units[0] ?? null);
  const [night, setNight] = useState(false);
  const [planUnit, setPlanUnit] = useState(null);
  const [activeSection, setActiveSection] = useState('proyecto');
  const [finderType, setFinderType] = useState('Todos');
  const [finderFloor, setFinderFloor] = useState('Todos');

  const finderUnits = useMemo(() => units.filter((unit) => (finderType === 'Todos' || unit.type === finderType) && (finderFloor === 'Todos' || String(unit.floor) === finderFloor)), [finderType, finderFloor]);
  const types = [...new Set(units.map((unit) => unit.type))];
  const fromPrice = Math.min(...units.map((unit) => unit.price));

  const go = (id) => { setActiveSection(id); document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }); };

  return <div className="experience">
    <header className="site-nav"><div className="logo"><span>RE</span><div><strong>REAL ESTATE</strong><small>DIGITAL PROPERTY EXPERIENCE</small></div></div><nav>{['proyecto','unidades','amenities','ubicacion'].map((item) => <button key={item} className={activeSection === item ? 'active' : ''} onClick={() => go(item)}>{item}</button>)}</nav><div className="nav-actions"><button className="theme-switch" onClick={() => setNight((value) => !value)}>{night ? '☼ Día' : '☾ Noche'}</button><button className="nav-contact" onClick={() => window.open('https://wa.me/?text=Hola%2C%20quiero%20informacion%20del%20proyecto%20Ocean%20Mansions', '_blank')}>Contactar</button></div></header>

    <main>
      <section id="proyecto" className="hero">
        <div className="scene"><Scene selectedFloor={selectedFloor} selectedUnit={selectedUnit} onSelectUnit={setSelectedUnit} night={night} /></div>
        <div className="hero-copy"><span className="eyebrow">PUNTA DEL ESTE · PLAYA MANSA</span><h1>Ocean<br/><em>Mansions</em></h1><p>Una nueva forma de recorrer, entender y elegir tu próxima propiedad.</p><div className="hero-cta"><button className="btn-dark" onClick={() => go('unidades')}>Explorar unidades <span>↗</span></button><button className="btn-ghost" onClick={() => setSelectedFloor(null)}>Ver edificio completo</button></div></div>
        <div className="scene-hint"><span>ARRASTRÁ PARA ROTAR</span><span>SCROLL PARA ZOOM</span></div>
        <div className="floor-picker"><div className="picker-label">PISOS</div><button className={selectedFloor === null ? 'selected' : ''} onClick={() => setSelectedFloor(null)}>ALL</button>{floors.map((floor) => <button key={floor} className={selectedFloor === floor ? 'selected' : ''} onClick={() => setSelectedFloor(floor)}>{floor}</button>)}</div>
        {selectedUnit && <UnitCard unit={selectedUnit} onPlan={() => setPlanUnit(selectedUnit)} onClose={() => setSelectedUnit(null)} />}
      </section>

      <section className="intro-band"><div><span className="eyebrow">EL PROYECTO</span><h2>Arquitectura pensada<br/>para vivir frente al mar.</h2></div><p>Un showroom digital que combina arquitectura, disponibilidad comercial y una experiencia inmersiva para que cada decisión tenga contexto.</p><div className="intro-price"><span>Desde</span><strong>{money.format(fromPrice)}</strong></div></section>

      <section id="unidades" className="section units-section"><div className="section-head"><div><span className="eyebrow">INVENTARIO EN TIEMPO REAL</span><h2>Encontrá tu unidad.</h2></div><div className="legend"><span><i className="dot available"/>Disponible {available}</span><span><i className="dot reserved"/>Reservado {reserved}</span><span><i className="dot sold"/>Vendida {sold}</span></div></div><div className="finder"><select value={finderType} onChange={(e) => setFinderType(e.target.value)}><option>Todos</option>{types.map((type) => <option key={type}>{type}</option>)}</select><select value={finderFloor} onChange={(e) => setFinderFloor(e.target.value)}><option>Todos</option>{floors.map((floor) => <option key={floor} value={floor}>Piso {floor}</option>)}</select><span className="result-count">{finderUnits.length} unidades</span></div><div className="unit-grid">{finderUnits.slice(0, 16).map((unit) => <button className="unit-tile" key={unit.id} onClick={() => { setSelectedUnit(unit); go('proyecto'); }}><div className="tile-top"><strong>{unit.number}</strong><span className={`availability ${unit.status.toLowerCase()}`}>{statusLabel(unit.status)}</span></div><span>{unit.type} · {unit.area} m²</span><b>{money.format(unit.price)}</b><small>Ver unidad ↗</small></button>)}</div></section>

      <section id="amenities" className="section dark-section"><div className="section-head light"><div><span className="eyebrow">AMENITIES</span><h2>Todo lo que pasa<br/>cuando llegás a casa.</h2></div><p>Espacios comunes pensados para extender la experiencia del hogar más allá de cada unidad.</p></div><div className="amenity-grid">{project.amenities.map((amenity, index) => <article key={amenity.id}><span className="amenity-number">0{index + 1}</span><h3>{amenity.name}</h3><p>{amenity.description}</p><button onClick={() => go('proyecto')}>Explorar espacio ↗</button></article>)}</div></section>

      <section id="ubicacion" className="section location-section"><div className="location-copy"><span className="eyebrow">UBICACIÓN</span><h2>Playa Mansa.<br/><em>Punta del Este.</em></h2><p>Viví cerca del mar, el puerto, restaurantes, shopping y todo lo que hace única a Punta del Este.</p><button className="btn-dark" onClick={() => window.open('https://www.google.com/maps/search/?api=1&query=Punta%20del%20Este%20Uruguay', '_blank')}>Abrir ubicación ↗</button></div><div className="map-card"><div className="map-grid"/><div className="map-pin main">Ocean Mansions</div><div className="map-pin p1">Playa Mansa</div><div className="map-pin p2">Puerto</div><div className="map-pin p3">Shopping</div><div className="map-distance">Todo cerca.<br/><strong>Mar, ciudad y naturaleza.</strong></div></div></section>

      <section className="final-cta"><span className="eyebrow">OCEAN MANSIONS</span><h2>La próxima visita<br/><em>puede empezar acá.</em></h2><button className="btn-light" onClick={() => window.open('https://wa.me/?text=Hola%2C%20quiero%20agendar%20una%20visita%20a%20Ocean%20Mansions', '_blank')}>Agendar visita ↗</button></section>
    </main>
    {planUnit && <PlanModal unit={planUnit} onClose={() => setPlanUnit(null)} />}
  </div>;
}
