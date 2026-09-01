import { Canvas } from '@react-three/fiber';
import { Environment, OrbitControls, ContactShadows, Html } from '@react-three/drei';
import { useMemo, useState } from 'react';
import { getProjectById } from '../platform/projectRegistry';
import { STATUS_LABELS } from '../domain/platformModels';

const project = getProjectById('ocean-mansions');
const floors = Array.from({ length: 12 }, (_, index) => index + 1);
const units = project.units ?? [];

const statusColor = (status) => {
  const value = STATUS_LABELS[status] ?? status;
  if (value === 'Disponible') return '#8fc9a8';
  if (value === 'Reservado') return '#d8b66b';
  return '#c98b8b';
};

function Water() {
  return <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.12, -28]} receiveShadow><planeGeometry args={[110, 50, 1, 1]} /><meshStandardMaterial color="#527f8c" roughness={0.18} metalness={0.35} /></mesh>;
}

function Palm({ position, scale = 1 }) {
  return <group position={position} scale={scale}>
    <mesh position={[0, 1.4, 0]} castShadow><cylinderGeometry args={[0.13, 0.2, 2.8, 10]} /><meshStandardMaterial color="#76513a" roughness={0.9} /></mesh>
    {Array.from({ length: 7 }, (_, i) => <mesh key={i} position={[0, 2.75, 0]} rotation={[0.15 + (i % 2) * 0.15, 0, (i / 7) * Math.PI * 2]} castShadow><coneGeometry args={[0.34, 2.4, 7, 1, true]} /><meshStandardMaterial color="#527a55" roughness={0.85} /></mesh>)}
  </group>;
}

function Neighbor({ position, height, width = 4 }) {
  return <group position={position}>
    <mesh position={[0, height / 2, 0]} castShadow><boxGeometry args={[width, height, 4]} /><meshStandardMaterial color="#c7c1b9" roughness={0.9} /></mesh>
    {Array.from({ length: Math.max(2, Math.floor(height / 1.8)) }, (_, floor) => <mesh key={floor} position={[0, 1 + floor * 1.8, 2.04]}><boxGeometry args={[width * 0.7, 0.65, 0.08]} /><meshStandardMaterial color="#91adb7" roughness={0.25} metalness={0.3} /></mesh>)}
  </group>;
}

function Building({ selectedFloor, onFloor, selectedUnit, onUnit }) {
  const visibleFloors = selectedFloor ? [selectedFloor] : floors;
  return <group position={[0, 0, 0]}>
    <mesh position={[0, 0.45, 0]} receiveShadow castShadow><boxGeometry args={[19, 0.9, 15]} /><meshStandardMaterial color="#d6cfc5" roughness={0.8} /></mesh>
    {visibleFloors.map((floor) => {
      const y = 1.45 + (floor - 1) * 2.15;
      const floorUnits = units.filter((unit) => Number(unit.floor) === floor);
      return <group key={floor} position={[0, y, 0]}>
        <mesh castShadow receiveShadow><boxGeometry args={[15.8, 1.75, 9.8]} /><meshStandardMaterial color="#d9d8d2" roughness={0.58} metalness={0.16} /></mesh>
        <mesh position={[0, 0.92, 0]} castShadow><boxGeometry args={[16.15, 0.12, 10.05]} /><meshStandardMaterial color="#b5b1aa" roughness={0.8} /></mesh>
        <mesh position={[0, 0, 4.92]}><boxGeometry args={[14.6, 1.25, 0.08]} /><meshStandardMaterial color="#6f8993" transparent opacity={0.82} metalness={0.55} roughness={0.16} /></mesh>
        <mesh position={[0, 0, -4.92]}><boxGeometry args={[14.6, 1.25, 0.08]} /><meshStandardMaterial color="#728b94" transparent opacity={0.78} metalness={0.55} roughness={0.18} /></mesh>
        {floorUnits.slice(0, 4).map((unit, index) => {
          const x = -5.1 + index * 3.4;
          const selected = selectedUnit?.id === unit.id;
          return <group key={unit.id} position={[x, -0.05, 4.97]} onClick={(event) => { event.stopPropagation(); onUnit(unit); }}>
            <mesh castShadow><boxGeometry args={[2.65, 1.05, 0.16]} /><meshStandardMaterial color={selected ? '#d9bb70' : statusColor(unit.status)} emissive={selected ? '#72571e' : '#000'} emissiveIntensity={selected ? 0.65 : 0.08} roughness={0.35} metalness={0.25} /></mesh>
            <mesh position={[0, -0.68, 0.15]} castShadow><boxGeometry args={[2.95, 0.12, 1.25]} /><meshStandardMaterial color="#c2b6a5" roughness={0.9} /></mesh>
            <mesh position={[0, -0.22, 0.24]}><boxGeometry args={[2.35, 0.08, 0.05]} /><meshStandardMaterial color="#56656b" metalness={0.8} roughness={0.22} /></mesh>
          </group>;
        })}
        <mesh position={[0, 0, 4.99]}><boxGeometry args={[0.18, 1.3, 0.12]} /><meshStandardMaterial color="#8c8d8c" metalness={0.8} /></mesh>
        {floor === 12 && <mesh position={[0, 1.05, 0]} castShadow><boxGeometry args={[16.1, 0.28, 10.1]} /><meshStandardMaterial color="#c9c1b7" roughness={0.72} /></mesh>}
        <Html position={[-8.2, 0.1, 0]} center distanceFactor={17} occlude>
          <button className={`floor-hotspot ${selectedFloor === floor ? 'is-selected' : ''}`} onClick={(event) => { event.stopPropagation(); onFloor(floor); }}>P{floor}</button>
        </Html>
      </group>;
    })}
    <group position={[0, 1.05, 4.7]}>
      <mesh castShadow><boxGeometry args={[5.5, 1.8, 1.2]} /><meshStandardMaterial color="#e1ddd5" roughness={0.65} /></mesh>
      <mesh position={[0, 0.2, 0.66]}><boxGeometry args={[3.2, 1.15, 0.08]} /><meshStandardMaterial color="#263e49" metalness={0.4} roughness={0.18} /></mesh>
    </group>
  </group>;
}

function Grounds() {
  return <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow><planeGeometry args={[100, 100]} /><meshStandardMaterial color="#c7d0c0" roughness={1} /></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 12]} receiveShadow><planeGeometry args={[34, 9]} /><meshStandardMaterial color="#b9b9b3" roughness={0.95} /></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 22]} receiveShadow><planeGeometry args={[32, 8]} /><meshStandardMaterial color="#e1ded7" roughness={0.9} /></mesh>
    <Water />
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.08, 26]} receiveShadow><planeGeometry args={[34, 2]} /><meshStandardMaterial color="#d6c7b0" roughness={0.95} /></mesh>
    <Neighbor position={[-16, 0, 7]} height={11} />
    <Neighbor position={[16, 0, 5]} height={8} width={5} />
    <Neighbor position={[-20, 0, -3]} height={6} width={6} />
    <Palm position={[-11, 0, 11]} scale={1.25} /><Palm position={[11, 0, 10]} scale={1.1} /><Palm position={[-14, 0, 20]} /><Palm position={[14, 0, 20]} scale={0.9} />
    <mesh position={[0, 0.35, 7]} castShadow receiveShadow><boxGeometry args={[11, 0.6, 4]} /><meshStandardMaterial color="#e5dfd6" roughness={0.65} /></mesh>
    <mesh position={[0, 0.67, 7]}><boxGeometry args={[8.5, 0.08, 2.4]} /><meshStandardMaterial color="#7ea9b2" metalness={0.2} roughness={0.12} /></mesh>
  </group>;
}

function Scene({ selectedFloor, onFloor, selectedUnit, onUnit }) {
  return <>
    <color attach="background" args={['#dfe8ea']} />
    <fog attach="fog" args={['#dfe8ea', 55, 105]} />
    <ambientLight intensity={1.2} />
    <directionalLight castShadow position={[25, 32, 12]} intensity={3} shadow-mapSize-width={2048} shadow-mapSize-height={2048} shadow-camera-left={-35} shadow-camera-right={35} shadow-camera-top={35} shadow-camera-bottom={-35} />
    <directionalLight position={[-18, 12, -20]} intensity={0.55} color="#b8d5df" />
    <Environment preset="sunset" background={false} />
    <Grounds />
    <Building selectedFloor={selectedFloor} onFloor={onFloor} selectedUnit={selectedUnit} onUnit={onUnit} />
    <ContactShadows position={[0, 0.02, 0]} opacity={0.3} scale={45} blur={2.8} far={28} />
    <OrbitControls enableDamping dampingFactor={0.06} minDistance={12} maxDistance={62} maxPolarAngle={Math.PI / 2.05} target={[0, 12, 0]} />
  </>;
}

export default function PremiumShowroom() {
  const [selectedFloor, setSelectedFloor] = useState(null);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const available = useMemo(() => units.filter((unit) => (STATUS_LABELS[unit.status] ?? unit.status) === 'Disponible').length, []);

  return <div className="premium-showroom">
    <Canvas shadows dpr={[1, 1.75]} camera={{ position: [27, 19, 31], fov: 42 }}>
      <Scene selectedFloor={selectedFloor} onFloor={setSelectedFloor} selectedUnit={selectedUnit} onUnit={setSelectedUnit} />
    </Canvas>
    <header className="premium-topbar">
      <div className="premium-brand"><span>R</span><div><b>REALESTATE</b><small>EXPERIENCE PLATFORM</small></div></div>
      <div className="premium-project"><small>PROYECTO</small><strong>{project.name}</strong><span>{project.location?.city ?? 'Punta del Este'} · Playa Mansa</span></div>
      <div className="premium-actions"><button onClick={() => setSelectedFloor(null)}>Vista general</button><a href="/admin">Panel ↗</a></div>
    </header>
    <aside className="premium-info">
      <span className="premium-kicker">OCEANFRONT RESIDENCES</span>
      <h1>Tu próxima<br /><em>forma de vivir.</em></h1>
      <p>Explorá el edificio, elegí un piso y descubrí cada unidad desde una experiencia 3D interactiva.</p>
      <div className="premium-stats"><div><b>{floors.length}</b><span>pisos</span></div><div><b>{units.length}</b><span>unidades</span></div><div><b>{available}</b><span>disponibles</span></div></div>
      <div className="premium-hint">Arrastrá para rotar · rueda para acercar · seleccioná una unidad</div>
    </aside>
    <div className="premium-floor-panel"><div><small>EXPLORAR PISOS</small><button className={selectedFloor === null ? 'active' : ''} onClick={() => setSelectedFloor(null)}>Todos</button></div><div className="floor-list">{[...floors].reverse().map((floor) => <button key={floor} className={selectedFloor === floor ? 'active' : ''} onClick={() => setSelectedFloor(selectedFloor === floor ? null : floor)}>{floor}</button>)}</div></div>
    {selectedUnit && <section className="premium-unit-card"><button className="close" onClick={() => setSelectedUnit(null)}>×</button><small>UNIDAD {selectedUnit.number ?? selectedUnit.id}</small><h2>Piso {selectedUnit.floor}</h2><div className="unit-meta"><span>{selectedUnit.surface ?? '—'} m²</span><span>{selectedUnit.plan ?? `${selectedUnit.bedrooms ?? '—'} dormitorios`}</span><span>{selectedUnit.currency ?? 'USD'} {new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(selectedUnit.price ?? 0)}</span></div><button className="unit-cta">Ver unidad y plano ↗</button></section>}
    <div className="premium-location"><span className="pulse" /> Frente al mar · Punta del Este</div>
  </div>;
}
