import { Canvas, useFrame } from '@react-three/fiber';
import { ContactShadows, Environment, OrbitControls, RoundedBox, Sky } from '@react-three/drei';
import { useMemo, useRef, useState } from 'react';
import { Vector3 } from 'three';
import { getProjectById } from '../platform/projectRegistry';
import { STATUS_LABELS } from '../domain/platformModels';

const project = getProjectById();
const units = project.units ?? [];
const floors = [...new Set(units.map((unit) => unit.floor))].sort((a, b) => a - b);
const maxFloor = Math.max(...floors, 10);
const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

const COLORS = { concrete: '#d9d3c9', concreteDark: '#aaa39a', glass: '#6d929c', glassNight: '#d6b77c', metal: '#34444b', water: '#5b9faf', sand: '#d3b47a' };
function statusLabel(status) { return STATUS_LABELS[status] ?? status; }
function statusColor(status, selected = false) { if (selected) return '#d9b66b'; if (status === 'AVAILABLE') return '#9ed0bf'; if (status === 'RESERVED') return '#e1c57f'; return '#c99696'; }

function Palm({ position, scale = 1 }) {
  return <group position={position} scale={scale}>
    <mesh position={[0, 1.7, 0]} castShadow><cylinderGeometry args={[.11, .19, 3.4, 10]} /><meshStandardMaterial color="#79563b" roughness={.9} /></mesh>
    {Array.from({ length: 9 }).map((_, i) => <mesh key={i} position={[Math.sin(i * .7) * .55, 3.25, Math.cos(i * .7) * .55]} rotation={[.35 + Math.sin(i) * .15, i * .7, .7]}><coneGeometry args={[.18, 2.5, 7]} /><meshStandardMaterial color="#3e7754" roughness={.9} /></mesh>)}
  </group>;
}

function PoolArea({ night }) {
  return <group position={[0, 0, 11]}>
    <RoundedBox args={[25, .35, 12]} radius={.35} smoothness={4} position={[0, .18, 0]} receiveShadow><meshStandardMaterial color="#d2c5b2" roughness={.8} /></RoundedBox>
    <RoundedBox args={[15.5, .28, 6.2]} radius={.45} smoothness={5} position={[0, .42, 0]} receiveShadow><meshStandardMaterial color={night ? '#456d78' : COLORS.water} roughness={.12} metalness={.15} emissive={night ? '#1d3940' : '#16404a'} emissiveIntensity={night ? .35 : .08} /></RoundedBox>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, .58, 0]}><planeGeometry args={[13.8, 4.9]} /><meshStandardMaterial color="#83c0c7" transparent opacity={.42} roughness={.05} /></mesh>
    {[-8.7, 8.7].map((x) => <group key={x} position={[x, .55, 0]}>{[-2.3, 0, 2.3].map((z) => <RoundedBox key={z} args={[2.1, .22, .75]} radius={.12} smoothness={3} position={[0, 0, z]} rotation={[0, 0, x < 0 ? -.08 : .08]}><meshStandardMaterial color="#e9e1d3" roughness={.75} /></RoundedBox>)}</group>)}
    <mesh position={[0, .42, 3.65]}><boxGeometry args={[16, .12, .35]} /><meshStandardMaterial color={COLORS.sand} roughness={.7} /></mesh>
  </group>;
}

function FacadeUnit({ unit, x, y, z, selected, night, onSelect }) {
  const color = statusColor(unit.status, selected);
  return <group position={[x, y, z]}>
    <RoundedBox args={[2.95, 2.05, .5]} radius={.08} smoothness={3}><meshStandardMaterial color={selected ? '#e4d4b1' : '#d8d2c8'} roughness={.62} metalness={.15} transparent opacity={selected ? .98 : .94} /></RoundedBox>
    <mesh position={[0, .12, .31]} onClick={(event) => { event.stopPropagation(); onSelect(unit); }} onPointerOver={() => { document.body.style.cursor = 'pointer'; }} onPointerOut={() => { document.body.style.cursor = 'default'; }}>
      <boxGeometry args={[2.45, 1.52, .12]} /><meshStandardMaterial color={night ? COLORS.glassNight : COLORS.glass} roughness={.12} metalness={.62} emissive={night ? '#8f5d20' : color} emissiveIntensity={selected ? .75 : night ? .35 : .06} />
    </mesh>
    <mesh position={[0, -.92, .46]} castShadow><boxGeometry args={[3.28, .14, 1.35]} /><meshStandardMaterial color="#c4b29d" roughness={.7} /></mesh>
    <mesh position={[0, -.08, 1.05]}><boxGeometry args={[2.5, .08, .08]} /><meshStandardMaterial color={selected ? '#e4c26f' : COLORS.metal} metalness={.85} roughness={.25} /></mesh>
    {[-1.15, -.38, .38, 1.15].map((rx) => <mesh key={rx} position={[rx, -.45, .96]}><cylinderGeometry args={[.025, .025, .92, 8]} /><meshStandardMaterial color={COLORS.metal} metalness={.9} roughness={.2} /></mesh>)}
  </group>;
}

function Tower({ selectedFloor, selectedUnit, night, onSelectUnit }) {
  const floorHeight = 2.72; const podiumTop = 4.3;
  return <group>
    <RoundedBox args={[17.5, 3.8, 12]} radius={.45} smoothness={5} position={[0, 2.05, 0]} castShadow receiveShadow><meshStandardMaterial color={COLORS.concreteDark} roughness={.72} /></RoundedBox>
    <RoundedBox args={[16.2, 1, 11.5]} radius={.25} smoothness={4} position={[0, 4.35, 0]} castShadow><meshStandardMaterial color={COLORS.concrete} roughness={.56} /></RoundedBox>
    <RoundedBox args={[8.2, 3.8, 5.8]} radius={.25} smoothness={4} position={[0, 5.2, 2]} castShadow><meshStandardMaterial color="#8a8178" roughness={.72} /></RoundedBox>
    {Array.from({ length: maxFloor }).map((_, index) => {
      const floor = floors[index] ?? index + 1; const y = podiumTop + index * floorHeight + floorHeight / 2; const floorUnits = units.filter((unit) => unit.floor === floor); const focused = selectedFloor == null || selectedFloor === floor; const opacity = focused ? 1 : .18;
      return <group key={floor} position={[0, y, 0]}>
        <mesh position={[0, -floorHeight / 2, 0]} receiveShadow><boxGeometry args={[17.8, .16, 12.1]} /><meshStandardMaterial color="#b8b0a5" roughness={.76} transparent opacity={opacity} /></mesh>
        <mesh position={[0, 0, 0]}><boxGeometry args={[.48, floorHeight, 11.3]} /><meshStandardMaterial color={COLORS.concrete} roughness={.65} transparent opacity={opacity} /></mesh>
        {floorUnits.map((unit, i) => <FacadeUnit key={unit.id} unit={unit} x={-5.45 + (i % 4) * 3.62} y={0} z={5.72} selected={selectedUnit?.id === unit.id} night={night} onSelect={onSelectUnit} />)}
        {Array.from({ length: 6 }).map((_, i) => <mesh key={`back-${i}`} position={[-7.8 + i * 3.12, 0, -5.72]}><boxGeometry args={[2.35, 1.75, .1]} /><meshStandardMaterial color={night ? '#c5a96e' : '#789aa2'} roughness={.16} metalness={.55} emissive={night ? '#9a6728' : '#193d46'} emissiveIntensity={night ? .38 : .04} transparent opacity={opacity} /></mesh>)}
      </group>;
    })}
    <RoundedBox args={[19.2, .7, 13]} radius={.28} smoothness={4} position={[0, podiumTop - .45, 0]}><meshStandardMaterial color="#d4cdc2" roughness={.65} /></RoundedBox>
    <mesh position={[0, podiumTop + .1, 5.65]}><boxGeometry args={[8, 2.5, .2]} /><meshStandardMaterial color={night ? '#c7a667' : '#7898a0'} roughness={.12} metalness={.55} emissive={night ? '#79501c' : '#123d48'} emissiveIntensity={night ? .35 : .04} /></mesh>
  </group>;
}

function Site({ night }) {
  return <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -.08, 0]} receiveShadow><planeGeometry args={[110, 110]} /><meshStandardMaterial color={night ? '#182526' : '#a7b79b'} roughness={1} /></mesh>
    <RoundedBox args={[38, .25, 18]} radius={.25} smoothness={4} position={[0, .05, 24]} receiveShadow><meshStandardMaterial color="#a7a8a3" roughness={.9} /></RoundedBox>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, .06, 35]}><planeGeometry args={[45, 24]} /><meshStandardMaterial color="#4f8894" roughness={.6} /></mesh>
    <PoolArea night={night} />
    {[[-16, 0, 9], [16, 0, 9], [-18, 0, -7], [18, 0, -7], [-13, 0, 18], [13, 0, 18]].map(([x, y, z], i) => <Palm key={i} position={[x, y, z]} scale={i > 3 ? .8 : 1} />)}
    <RoundedBox args={[8, .25, 2.6]} radius={.18} smoothness={3} position={[-13, .3, -1]}><meshStandardMaterial color="#bda78c" roughness={.9} /></RoundedBox>
    <RoundedBox args={[8, .25, 2.6]} radius={.18} smoothness={3} position={[13, .3, -1]}><meshStandardMaterial color="#bda78c" roughness={.9} /></RoundedBox>
  </group>;
}

function CameraRig({ mode, controlsRef }) {
  const targets = useMemo(() => ({ master: { position: new Vector3(31, 21, 36), target: new Vector3(0, 10, 6) }, building: { position: new Vector3(25, 15, 25), target: new Vector3(0, 13, 1) }, close: { position: new Vector3(13, 12, 18), target: new Vector3(0, 14, 4) }, pool: { position: new Vector3(18, 8, 17), target: new Vector3(0, 5, 9) } }), []);
  useFrame(({ camera }) => { const preset = targets[mode] ?? targets.building; camera.position.lerp(preset.position, .055); if (controlsRef.current) controlsRef.current.target.lerp(preset.target, .07); camera.lookAt(preset.target); });
  return null;
}

function Scene({ selectedFloor, selectedUnit, night, cameraMode, tour, onSelectUnit }) {
  const controlsRef = useRef();
  return <Canvas shadows camera={{ position: [31, 21, 36], fov: 36 }} dpr={[1, 1.7]} gl={{ antialias: true, powerPreference: 'high-performance' }}>
    <color attach="background" args={[night ? '#071219' : '#a8c6cf']} /><fog attach="fog" args={[night ? '#071219' : '#a8c6cf', 38, 90]} />
    <ambientLight intensity={night ? .48 : 1.25} /><directionalLight castShadow position={[18, 32, 10]} intensity={night ? 1.15 : 3.1} color={night ? '#e5bd75' : '#fff1d0'} shadow-mapSize-width={2048} shadow-mapSize-height={2048} shadow-camera-left={-35} shadow-camera-right={35} shadow-camera-top={35} shadow-camera-bottom={-35} />
    <Environment preset="city" /><Sky distance={450000} sunPosition={night ? [-4, -2, 2] : [8, 8, 5]} inclination={night ? .82 : .48} azimuth={.22} />
    <Site night={night} /><Tower selectedFloor={selectedFloor} selectedUnit={selectedUnit} night={night} onSelectUnit={onSelectUnit} /><ContactShadows position={[0, -.02, 0]} opacity={night ? .32 : .42} scale={62} blur={2.5} far={42} />
    <CameraRig mode={cameraMode} controlsRef={controlsRef} /><OrbitControls ref={controlsRef} makeDefault enableDamping dampingFactor={.06} minDistance={13} maxDistance={58} maxPolarAngle={Math.PI / 2.03} autoRotate={tour} autoRotateSpeed={.55} target={[0, 10, 6]} />
  </Canvas>;
}

function UnitCard({ unit, onPlan, onClose, onFocus }) {
  if (!unit) return null; const area = unit.area ?? unit.surface ?? 0;
  return <aside className="unit-detail"><button className="icon-close" onClick={onClose}>×</button><div className="unit-kicker">UNIDAD {unit.number} · PISO {unit.floor}</div><h2>{unit.type}</h2><div className={`availability ${unit.status.toLowerCase()}`}>{statusLabel(unit.status)}</div><div className="unit-price">{money.format(unit.price)}</div><div className="unit-metrics"><span><b>{area} m²</b> superficie</span><span><b>{unit.terrace} m²</b> terraza</span><span><b>{unit.bedrooms}</b> dormitorios</span><span><b>{unit.bathrooms}</b> baños</span></div><p>{unit.description}</p><div className="unit-actions"><button className="btn-dark" onClick={onFocus}>Ver unidad <span>↗</span></button><button className="btn-outline" onClick={onPlan}>Ver plano</button></div></aside>;
}

function PlanModal({ unit, onClose }) {
  if (!unit) return null; const area = unit.area ?? unit.surface ?? 0;
  return <div className="modal" onClick={onClose}><div className="plan-modal" onClick={(event) => event.stopPropagation()}><div className="modal-head"><div><span>PLANO INTERACTIVO · UNIDAD {unit.number}</span><h3>{unit.type} · {area} m²</h3></div><button className="icon-close" onClick={onClose}>×</button></div><div className="plan-tabs"><button className="active">2D</button><button>3D</button><button>AMOBLADO</button></div><svg viewBox="0 0 820 480" className="plan-art"><rect x="20" y="20" width="780" height="440" rx="22" fill="#f5efe4" stroke="#b8aa96" strokeWidth="3"/><rect x="50" y="50" width="300" height="165" fill="#d9e6e8" stroke="#a7b7b9" strokeWidth="3"/><rect x="370" y="50" width="390" height="115" fill="#eadbc5" stroke="#c8b18f" strokeWidth="3"/><rect x="50" y="235" width="205" height="190" fill="#e1ddd5" stroke="#b9afa1" strokeWidth="3"/><rect x="275" y="235" width="205" height="190" fill="#dce6da" stroke="#aebdac" strokeWidth="3"/><rect x="500" y="190" width="260" height="235" fill="#d8e0e5" stroke="#a8b5be" strokeWidth="3"/><text x="128" y="140" fontSize="25" fill="#23313a">Living / Comedor</text><text x="510" y="118" fontSize="24" fill="#4b4032">Cocina</text><text x="105" y="330" fontSize="20" fill="#3b3935">Dormitorio</text><text x="330" y="330" fontSize="20" fill="#3b3935">Dormitorio</text><text x="575" y="285" fontSize="20" fill="#3b3935">Suite</text><text x="590" y="350" fontSize="20" fill="#3b3935">Baños</text><text x="325" y="448" fontSize="18" fill="#6b6258">Terraza · {unit.terrace} m²</text></svg></div></div>;
}

export default function ShowroomExperience() {
  const [selectedFloor, setSelectedFloor] = useState(null); const [selectedUnit, setSelectedUnit] = useState(null); const [night, setNight] = useState(false); const [planUnit, setPlanUnit] = useState(null); const [cameraMode, setCameraMode] = useState('master'); const [tour, setTour] = useState(false); const [activeSection, setActiveSection] = useState('proyecto'); const [finderType, setFinderType] = useState('Todos'); const [finderFloor, setFinderFloor] = useState('Todos');
  const finderUnits = useMemo(() => units.filter((unit) => (finderType === 'Todos' || unit.type === finderType) && (finderFloor === 'Todos' || String(unit.floor) === finderFloor)), [finderType, finderFloor]);
  const types = [...new Set(units.map((unit) => unit.type))]; const fromPrice = Math.min(...units.map((unit) => unit.price)); const available = units.filter((unit) => unit.status === 'AVAILABLE').length; const reserved = units.filter((unit) => unit.status === 'RESERVED').length; const sold = units.filter((unit) => unit.status === 'SOLD').length;
  const go = (id) => { setActiveSection(id); document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }); }; const focusUnit = (unit) => { setSelectedUnit(unit); setSelectedFloor(unit.floor); setCameraMode('close'); document.getElementById('proyecto')?.scrollIntoView({ behavior: 'smooth' }); };
  return <div className={`experience ${night ? 'is-night' : ''}`}>
    <header className="site-nav"><div className="logo"><span>RE</span><div><strong>REAL ESTATE</strong><small>DIGITAL PROPERTY EXPERIENCE</small></div></div><nav>{['proyecto','unidades','amenities','ubicacion'].map((item) => <button key={item} className={activeSection === item ? 'active' : ''} onClick={() => go(item)}>{item}</button>)}</nav><div className="nav-actions"><button className="theme-switch" onClick={() => setNight((value) => !value)}>{night ? '☼ Día' : '☾ Noche'}</button><button className="nav-contact" onClick={() => window.open('https://wa.me/?text=Hola%2C%20quiero%20informacion%20del%20proyecto%20Ocean%20Mansions', '_blank')}>Contactar</button></div></header>
    <main>
      <section id="proyecto" className="hero"><div className="scene"><Scene selectedFloor={selectedFloor} selectedUnit={selectedUnit} night={night} cameraMode={cameraMode} tour={tour} onSelectUnit={(unit) => { setSelectedUnit(unit); setCameraMode('close'); }} /></div><div className="hero-gradient" /><div className="hero-copy"><span className="eyebrow">PUNTA DEL ESTE · PLAYA MANSA</span><h1>Ocean<br/><em>Mansions</em></h1><p>Recorré el proyecto. Explorá cada piso. Encontrá la unidad que querés.</p><div className="hero-cta"><button className="btn-dark" onClick={() => { setCameraMode('building'); setSelectedFloor(null); }}>Explorar edificio <span>↗</span></button><button className="btn-ghost" onClick={() => setTour((value) => !value)}>{tour ? 'Detener tour' : 'Tour 360°'}</button></div></div><div className="scene-controls"><button className={cameraMode === 'master' ? 'active' : ''} onClick={() => setCameraMode('master')}>Masterplan</button><button className={cameraMode === 'building' ? 'active' : ''} onClick={() => setCameraMode('building')}>Edificio</button><button className={cameraMode === 'pool' ? 'active' : ''} onClick={() => setCameraMode('pool')}>Amenities</button></div><div className="floor-picker"><span className="picker-label">PISOS</span><button className={selectedFloor === null ? 'selected' : ''} onClick={() => { setSelectedFloor(null); setCameraMode('building'); }}>ALL</button>{floors.map((floor) => <button key={floor} className={selectedFloor === floor ? 'selected' : ''} onClick={() => { setSelectedFloor(floor); setCameraMode('close'); }}>{String(floor).padStart(2, '0')}</button>)}</div><div className="hero-stats"><span><b>{units.length}</b> unidades</span><span><b>{floors.length}</b> pisos</span><span><b>USD {Math.round(fromPrice / 1000)}K</b> desde</span></div>{selectedUnit && <UnitCard unit={selectedUnit} onPlan={() => setPlanUnit(selectedUnit)} onClose={() => setSelectedUnit(null)} onFocus={() => focusUnit(selectedUnit)} />}<div className="scene-hint"><span>DRAG · ORBITAR</span><span>SCROLL · ZOOM</span><span>CLICK · EXPLORAR</span></div></section>
      <section className="intro-band"><div><span className="eyebrow">EL PROYECTO</span><h2>Una propiedad<br/><em>para recorrer.</em></h2></div><p>La experiencia está pensada para que la arquitectura, la disponibilidad y la información comercial convivan en el mismo recorrido. No mirás un plano: entendés el proyecto.</p><div className="intro-price"><span>Unidades desde</span><strong>{money.format(fromPrice)}</strong></div></section>
      <section id="unidades" className="section units-section"><div className="section-head"><div><span className="eyebrow">INVENTARIO EN TIEMPO REAL</span><h2>Encontrá tu<br/><em>unidad.</em></h2></div><p>Seleccioná una tipología o un piso. Cada unidad está vinculada al edificio 3D y a su ficha comercial.</p></div><div className="finder"><select value={finderType} onChange={(e) => setFinderType(e.target.value)}><option>Todos</option>{types.map((type) => <option key={type}>{type}</option>)}</select><select value={finderFloor} onChange={(e) => setFinderFloor(e.target.value)}><option>Todos</option>{floors.map((floor) => <option key={floor}>{floor}</option>)}</select><div className="legend"><span><i className="dot available" /> {available} disponibles</span><span><i className="dot reserved" /> {reserved} reservadas</span><span><i className="dot sold" /> {sold} vendidas</span></div><span className="result-count">{finderUnits.length} resultados</span></div><div className="unit-grid">{finderUnits.map((unit) => <button key={unit.id} className="unit-tile" onClick={() => focusUnit(unit)}><div className="tile-top"><strong>{unit.number}</strong><i className={`dot ${unit.status.toLowerCase()}`} /></div><span>{unit.type} · Piso {unit.floor}</span><b>{money.format(unit.price)}</b><small>{unit.area ?? unit.surface ?? 0} m² · {unit.bedrooms} dorm.</small></button>)}</div></section>
      <section id="amenities" className="section dark-section"><div className="section-head light"><div><span className="eyebrow">AMENITIES</span><h2>Todo lo que<br/><em>te rodea.</em></h2></div><p>Espacios pensados para vivir el edificio como un destino, no solamente como una vivienda.</p></div><div className="amenity-grid">{project.amenities?.map((amenity, index) => <article key={amenity.id}><span className="amenity-number">0{index + 1}</span><h3>{amenity.name}</h3><p>{amenity.description}</p><button onClick={() => { setCameraMode(index === 0 ? 'pool' : 'building'); go('proyecto'); }}>Explorar espacio ↗</button></article>)}</div></section>
      <section id="ubicacion" className="location-section"><div className="location-copy"><span className="eyebrow">UBICACIÓN</span><h2>Playa<br/><em>Mansa.</em></h2><p>Una ubicación privilegiada en Punta del Este, cerca del mar, servicios y los puntos que hacen de la zona uno de los destinos más buscados.</p><button className="btn-dark" onClick={() => window.open('https://www.google.com/maps/search/?api=1&query=-34.9,-54.9', '_blank')}>Abrir en Maps ↗</button></div><div className="map-card"><div className="map-grid" /><span className="map-pin main">Ocean Mansions</span><span className="map-pin p1">Playa Mansa</span><span className="map-pin p2">Puerto</span><span className="map-pin p3">La Barra</span><div className="map-distance"><strong>Punta del Este</strong><br/>Playa Mansa · Uruguay</div></div></section>
      <section className="final-cta"><span className="eyebrow">TU PRÓXIMA PROPIEDAD</span><h2>¿La<br/><em>recorremos?</em></h2><button className="btn-light" onClick={() => window.open('https://wa.me/?text=Hola%2C%20quiero%20coordinar%20una%20visita%20a%20Ocean%20Mansions', '_blank')}>Quiero información ↗</button></section>
    </main>{planUnit && <PlanModal unit={planUnit} onClose={() => setPlanUnit(null)} />}
  </div>;
}
