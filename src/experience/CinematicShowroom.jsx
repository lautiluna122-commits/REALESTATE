import { Canvas, useFrame } from '@react-three/fiber';
import { ContactShadows, Environment, Html, OrbitControls, RoundedBox, Sky } from '@react-three/drei';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Vector3 } from 'three';
import { getProjectBySlug } from '../platform/projectRegistry';
import { STATUS_LABELS } from '../domain/platformModels';
import './cinematic-showroom.css';

const pathname = typeof window !== 'undefined' ? window.location.pathname.replace(/\/+$/, '') : '/';
const slug = pathname.match(/^\/(?:proyecto|embed)\/([^/]+)$/)?.[1] ?? 'ocean-mansions';
const project = getProjectBySlug(slug);
const units = project.units ?? [];
const floors = [...new Set(units.map((u) => u.floor).filter(Boolean))].sort((a, b) => a - b);
const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const rooms = [
  { id: 'living', label: 'Living', position: [0, 2.7, 12], target: [0, 1.7, 5], copy: 'La vida empieza acá.' },
  { id: 'kitchen', label: 'Cocina', position: [10, 3.1, 3], target: [5, 1.6, 0], copy: 'Materiales, luz y detalle.' },
  { id: 'suite', label: 'Suite', position: [-10, 3.1, -5], target: [-4, 1.7, -4], copy: 'Un espacio para bajar el ritmo.' },
  { id: 'bedroom', label: 'Dormitorio', position: [9, 3, -9], target: [4, 1.6, -5], copy: 'Privacidad y luz natural.' },
  { id: 'terrace', label: 'Terraza', position: [0, 4.2, -15], target: [0, 2.2, -8], copy: 'El horizonte como extensión.' },
];

const statusLabel = (s) => STATUS_LABELS[s] ?? s ?? 'Sin estado';

function Furniture({ room, night }) {
  if (room === 'kitchen') return <group><RoundedBox args={[5.8, .8, 1.2]} radius={.12} position={[4.7, .7, 0]}><meshStandardMaterial color="#d8d0c2" roughness={.38} /></RoundedBox><RoundedBox args={[2.4, 1.8, .8]} radius={.08} position={[6.3, 1.55, -1.4]}><meshStandardMaterial color="#aaa49b" roughness={.45} /></RoundedBox><mesh position={[4.7, 1.15, 0]}><boxGeometry args={[5.4, .06, 1]} /><meshStandardMaterial color="#b9a58a" roughness={.2} metalness={.35} /></mesh></group>;
  if (room === 'suite' || room === 'bedroom') return <group><RoundedBox args={[4.8, .6, 6]} radius={.18} position={[-4, .5, -4]}><meshStandardMaterial color="#cfc8bc" roughness={.8} /></RoundedBox><RoundedBox args={[4.2, .55, 2.6]} radius={.22} position={[-4, .85, -5.1]}><meshStandardMaterial color="#e7e0d5" roughness={.7} /></RoundedBox><mesh position={[-4, 3.5, -6.9]}><boxGeometry args={[6, 4.5, .18]} /><meshStandardMaterial color="#d9d2c6" roughness={.85} /></mesh></group>;
  return <group><RoundedBox args={[7.5, .7, 3.2]} radius={.28} position={[-2, .7, 5]}><meshStandardMaterial color="#9d9182" roughness={.86} /></RoundedBox><RoundedBox args={[2.4, .45, 2.2]} radius={.2} position={[5, .48, 5]}><meshStandardMaterial color="#d7cfc1" roughness={.72} /></RoundedBox><mesh position={[0, 2.9, -7.7]}><boxGeometry args={[16, 5.4, .12]} /><meshStandardMaterial color={night ? '#6f6251' : '#6d9199'} roughness={.08} metalness={.45} emissive={night ? '#392b1c' : '#122f36'} emissiveIntensity={night ? .5 : .06} /></mesh></group>;
}

function InteriorScene({ unit, night, room }) {
  const active = rooms.find((r) => r.id === room) ?? rooms[0];
  return <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[28, 26]} /><meshStandardMaterial color="#c9c0b2" roughness={.78} /></mesh>
    <mesh position={[0, 5, -8]}><boxGeometry args={[28, 10, .3]} /><meshStandardMaterial color="#eee9df" roughness={.8} /></mesh>
    <mesh position={[-13.8, 4, 0]}><boxGeometry args={[.3, 8, 20]} /><meshStandardMaterial color="#eee9df" roughness={.8} /></mesh>
    <mesh position={[13.8, 4, 0]}><boxGeometry args={[.3, 8, 20]} /><meshStandardMaterial color="#eee9df" roughness={.8} /></mesh>
    <mesh position={[0, 4, -7.72]}><boxGeometry args={[18, 6.5, .08]} /><meshStandardMaterial color={night ? '#7f694d' : '#789aa1'} roughness={.07} metalness={.6} emissive={night ? '#5b3c1c' : '#163c44'} emissiveIntensity={night ? .45 : .05} /></mesh>
    <RoundedBox args={[9, .08, 6]} radius={.1} position={[0, 4.1, -8]}><meshStandardMaterial color="#e5dfd6" transparent opacity={.32} roughness={.05} /></RoundedBox>
    <mesh position={[0, 8.1, 0]}><boxGeometry args={[27.4, .18, 25]} /><meshStandardMaterial color="#f1ede5" roughness={.78} /></mesh>
    <Furniture room={active.id === 'living' ? 'living' : active.id} night={night} />
    <mesh position={[0, .55, 5]}><boxGeometry args={[.05, 1.1, 9]} /><meshStandardMaterial color="#b9a58a" roughness={.3} /></mesh>
    <Html position={[active.target[0], 4.8, active.target[2]]} center distanceFactor={9}><div className="room-title"><span>{active.label}</span><strong>{active.copy}</strong></div></Html>
    <Html position={[-11.8, 6.7, -7.5]} transform distanceFactor={9}><div className="interior-spec"><span>UNIDAD {unit?.number ?? '—'}</span><b>{unit?.surface ?? unit?.area ?? 0} m²</b><small>{unit?.bedrooms ?? 0} dormitorios · {unit?.bathrooms ?? 0} baños</small></div></Html>
  </group>;
}

function ExteriorScene({ night, selectedFloor, selectedUnit, onSelectUnit }) {
  const height = 2.7; const podium = 4.2; const max = Math.max(...floors, 10);
  return <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -.1, 0]} receiveShadow><planeGeometry args={[120, 120]} /><meshStandardMaterial color={night ? '#182426' : '#9eae94'} roughness={1} /></mesh>
    <RoundedBox args={[18, 4, 12]} radius={.45} smoothness={5} position={[0, 2, 0]} castShadow><meshStandardMaterial color="#a9a39a" roughness={.72} /></RoundedBox>
    {Array.from({ length: max }).map((_, i) => { const floor = floors[i] ?? i + 1; const y = podium + i * height + height / 2; const active = selectedFloor == null || selectedFloor === floor; const floorUnits = units.filter((u) => u.floor === floor); return <group key={floor} position={[0, y, 0]}>
      <mesh position={[0, -height / 2, 0]}><boxGeometry args={[18.4, .16, 12.2]} /><meshStandardMaterial color={selectedFloor === floor ? '#c8ad75' : '#bdb6ac'} transparent opacity={active ? 1 : .08} roughness={.68} /></mesh>
      {floorUnits.map((u, j) => <mesh key={u.id} position={[-5.5 + (j % 4) * 3.7, 0, 6.05]} onClick={(e) => { e.stopPropagation(); onSelectUnit(u); }}><boxGeometry args={[2.8, 1.8, .12]} /><meshStandardMaterial color={night ? '#c7a769' : '#668f99'} roughness={.12} metalness={.55} emissive={selectedUnit?.id === u.id ? '#d8a943' : '#163941'} emissiveIntensity={selectedUnit?.id === u.id ? 1 : night ? .35 : .04} transparent opacity={active ? 1 : .08} /></mesh>)}
    </group>; })}
    <RoundedBox args={[19.5, .7, 13]} radius={.28} smoothness={4} position={[0, 3.75, 0]}><meshStandardMaterial color="#d4cec4" roughness={.65} /></RoundedBox>
    <RoundedBox args={[15, .55, 8]} radius={.25} smoothness={4} position={[0, podium + max * height + .2, 0]}><meshStandardMaterial color="#c7c0b6" roughness={.58} /></RoundedBox>
    <RoundedBox args={[26, .22, 12]} radius={.3} smoothness={4} position={[0, .08, 13]}><meshStandardMaterial color="#cbbda7" roughness={.8} /></RoundedBox>
    <RoundedBox args={[16, .25, 7]} radius={.3} smoothness={4} position={[0, .3, 13]}><meshStandardMaterial color={night ? '#456a72' : '#5b9faf'} roughness={.12} metalness={.2} emissive="#123f49" emissiveIntensity={.08} /></RoundedBox>
  </group>;
}

function CameraRig({ interior, room, mode, selectedFloor }) {
  const controls = useRef();
  const interiorTargets = useMemo(() => Object.fromEntries(rooms.map((r) => [r.id, { position: new Vector3(...r.position), target: new Vector3(...r.target) }])), []);
  const exteriorTargets = { master: { position: [34, 24, 40], target: [0, 12, 7] }, building: { position: [25, 16, 27], target: [0, 14, 1] }, pool: { position: [19, 8, 20], target: [0, 4, 13] }, close: { position: [13, 12, 18], target: [0, 14, 4] } };
  useFrame(({ camera }) => {
    const p = interior ? interiorTargets[room] : exteriorTargets[mode] ?? exteriorTargets.building;
    const lift = !interior && selectedFloor ? (selectedFloor - 1) * .32 : 0;
    camera.position.lerp(new Vector3(p.position.x, p.position.y + lift, p.position.z), .055);
    controls.current?.target.lerp(new Vector3(p.target.x, p.target.y + lift, p.target.z), .065);
  });
  return <OrbitControls ref={controls} makeDefault enableDamping dampingFactor={.07} minDistance={interior ? 4.5 : 11} maxDistance={interior ? 22 : 68} maxPolarAngle={Math.PI / 2.02} />;
}

function Scene({ interior, room, mode, selectedFloor, selectedUnit, night, onSelectUnit }) {
  return <Canvas shadows camera={{ position: [34, 24, 40], fov: 34 }} dpr={[1, 1.7]} gl={{ antialias: true, powerPreference: 'high-performance' }}>
    <color attach="background" args={[interior ? (night ? '#17130f' : '#d8d0c4') : (night ? '#071217' : '#a8c6cf')]} />
    {interior ? <><ambientLight intensity={night ? .55 : 1.35} /><directionalLight castShadow position={[-4, 9, 5]} intensity={night ? 1.1 : 2.2} color={night ? '#f0b86c' : '#fff1d4'} /><pointLight position={[0, 4, 2]} intensity={night ? 1.4 : .55} color="#ffe3b1" /><InteriorScene unit={selectedUnit} night={night} room={room} /></> : <><ambientLight intensity={night ? .4 : 1.1} /><directionalLight castShadow position={[18, 32, 10]} intensity={night ? 1.2 : 3.1} color={night ? '#e6bd79' : '#fff0cf'} shadow-mapSize-width={2048} shadow-mapSize-height={2048} /><Environment preset="city" /><Sky distance={450000} sunPosition={night ? [-4, -2, 2] : [8, 8, 5]} inclination={night ? .82 : .48} azimuth={.22} /><ExteriorScene night={night} selectedFloor={selectedFloor} selectedUnit={selectedUnit} onSelectUnit={onSelectUnit} /><ContactShadows position={[0, -.02, 0]} opacity={night ? .3 : .42} scale={70} blur={2.5} far={45} /></>}
    <CameraRig interior={interior} room={room} mode={mode} selectedFloor={selectedFloor} />
  </Canvas>;
}

function UnitCard({ unit, onEnter, onClose }) {
  if (!unit) return null;
  return <aside className="cin-unit-card"><button className="cin-close" onClick={onClose}>×</button><span>UNIDAD {unit.number} · PISO {unit.floor}</span><h2>{unit.type ?? 'Apartamento'}</h2><strong>{money.format(unit.price ?? 0)}</strong><div><b>{unit.surface ?? unit.area ?? 0} m²</b> · <b>{unit.bedrooms ?? 0}</b> dorm. · <b>{unit.bathrooms ?? 0}</b> baños</div><small className={`cin-status ${(unit.status ?? '').toLowerCase()}`}>{statusLabel(unit.status)}</small><button className="cin-primary" onClick={onEnter}>Entrar al departamento ↗</button></aside>;
}

export default function CinematicShowroom() {
  const [interior, setInterior] = useState(false); const [room, setRoom] = useState('living'); const [mode, setMode] = useState('master'); const [night, setNight] = useState(false); const [selectedFloor, setSelectedFloor] = useState(null); const [selectedUnit, setSelectedUnit] = useState(null); const [tour, setTour] = useState(false);
  const embed = pathname.startsWith('/embed/');
  const content = project.config?.content ?? {};
  useEffect(() => { if (!tour || !interior) return undefined; const id = window.setInterval(() => setRoom((current) => rooms[(rooms.findIndex((r) => r.id === current) + 1) % rooms.length].id), 4200); return () => window.clearInterval(id); }, [tour, interior]);
  const enter = (unit) => { setSelectedUnit(unit); setSelectedFloor(unit.floor); setInterior(true); setRoom('living'); setTour(false); };
  const available = units.filter((u) => u.status === 'AVAILABLE').length;
  const fromPrice = units.length ? Math.min(...units.map((u) => u.price ?? 0)) : 0;

  return <div className={`cin-showroom ${interior ? 'cin-interior' : ''} ${night ? 'cin-night' : ''}`}>
    <header className="cin-nav"><div className="cin-brand"><span>RE</span><div><b>{project.name ?? 'REAL ESTATE'}</b><small>DIGITAL PROPERTY EXPERIENCE</small></div></div><div className="cin-nav-actions">{interior && <button onClick={() => setInterior(false)}>← Edificio</button>}<button onClick={() => setNight((v) => !v)}>{night ? '☼ Día' : '☾ Noche'}</button>{!embed && <a href={`/cliente/${project.slug}`}>Panel</a>}</div></header>
    <main className="cin-stage"><Scene interior={interior} room={room} mode={mode} selectedFloor={selectedFloor} selectedUnit={selectedUnit} night={night} onSelectUnit={(u) => { setSelectedUnit(u); setSelectedFloor(u.floor); setMode('close'); }} />
      {!interior ? <div className="cin-overlay"><div className="cin-copy"><span>EXPERIENCIA INMOBILIARIA · {project.location?.city ?? 'URUGUAY'}</span><h1>{content.heroTitle ?? project.name}</h1><p>{content.heroSubtitle ?? 'Recorré el proyecto, elegí una unidad y entrá a conocerla por dentro.'}</p><div className="cin-actions"><button className="cin-primary" onClick={() => setMode('building')}>Explorar edificio ↗</button><button className="cin-secondary" onClick={() => setTour((v) => !v)}>{tour ? 'Detener recorrido' : 'Tour cinematográfico'}</button></div></div><div className="cin-floorbar"><small>PISOS</small><button className={!selectedFloor ? 'active' : ''} onClick={() => { setSelectedFloor(null); setMode('master'); }}>TODOS</button>{floors.map((f) => <button key={f} className={selectedFloor === f ? 'active' : ''} onClick={() => { setSelectedFloor(f); setMode('close'); }}>{String(f).padStart(2, '0')}</button>)}</div>{selectedUnit && <UnitCard unit={selectedUnit} onEnter={() => enter(selectedUnit)} onClose={() => setSelectedUnit(null)} />}<div className="cin-bottom"><span>{units.length} unidades</span><span>{available} disponibles</span><span>desde {money.format(fromPrice)}</span><span>Exterior · interior · 360° ready</span></div></div> : <div className="cin-interior-ui"><div className="cin-interior-head"><span>UNIDAD {selectedUnit?.number ?? '—'} · EXPERIENCIA INTERIOR</span><h1>{selectedUnit?.type ?? 'Apartamento'}</h1><p>{selectedUnit?.surface ?? 0} m² · {selectedUnit?.bedrooms ?? 0} dormitorios</p></div><div className="cin-roombar">{rooms.map((r) => <button key={r.id} className={room === r.id ? 'active' : ''} onClick={() => setRoom(r.id)}>{r.label}</button>)}<button className={tour ? 'active' : ''} onClick={() => setTour((v) => !v)}>{tour ? 'Pausar' : 'Recorrido'}</button></div><div className="cin-interior-hint">ARRASTRÁ PARA MIRAR · ACERCÁ PARA EXPLORAR</div></div>}
    </main>
    {!interior && <section className="cin-sales-strip"><div><span>EL PRODUCTO PRINCIPAL</span><h2>No mires el departamento.<br /><em>Entrá.</em></h2></div><p>{content.introText ?? 'La experiencia empieza en el edificio, pero la decisión ocurre cuando el comprador puede imaginarse viviendo dentro de su futura unidad.'}</p><button className="cin-primary" onClick={() => units[0] && enter(units[0])}>Entrar a una unidad ↗</button></section>}
  </div>;
}
