import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, OrbitControls, RoundedBox, Sky, Text, ContactShadows } from '@react-three/drei';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Vector3 } from 'three';
import { getProjectById } from '../platform/projectRegistry';
import { STATUS_LABELS } from '../domain/platformModels';

const project = getProjectById();
const units = project.units ?? [];
const floors = [...new Set(units.map((u) => u.floor))].sort((a, b) => a - b);
const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

const statusColor = (status, active = false) => active ? '#d9b66b' : status === 'AVAILABLE' ? '#77c3a5' : status === 'RESERVED' ? '#d6b66b' : '#b98282';

function Tree({ position, scale = 1 }) {
  return <group position={position} scale={scale}>
    <mesh position={[0, 1.5, 0]} castShadow><cylinderGeometry args={[.12, .2, 3, 8]} /><meshStandardMaterial color="#5d4331" roughness={1} /></mesh>
    {[0, 1, 2, 3, 4].map((i) => <mesh key={i} position={[Math.sin(i * 1.3) * .45, 2.8 + i * .12, Math.cos(i * 1.3) * .45]} rotation={[.35, i * 1.3, .35]}><coneGeometry args={[.8 - i * .08, 1.5, 8]} /><meshStandardMaterial color="#355d48" roughness={1} /></mesh>)}
  </group>;
}

function Furniture({ mode }) {
  if (mode !== 'interior') return null;
  return <group position={[0, 0, 0]}>
    <RoundedBox args={[5.2, .18, 2.4]} radius={.12} position={[-1.2, .55, 1]}><meshStandardMaterial color="#d4c7b7" roughness={.72} /></RoundedBox>
    <RoundedBox args={[1.1, .75, 2.15]} radius={.16} position={[-3.15, .9, 1]}><meshStandardMaterial color="#77746e" roughness={.8} /></RoundedBox>
    <RoundedBox args={[1.1, .75, 2.15]} radius={.16} position={[.75, .9, 1]}><meshStandardMaterial color="#77746e" roughness={.8} /></RoundedBox>
    <RoundedBox args={[2.1, .12, 1.05]} radius={.08} position={[-1.2, 1.25, 1]}><meshStandardMaterial color="#9b8064" roughness={.45} /></RoundedBox>
    <RoundedBox args={[1.8, .08, .9]} radius={.04} position={[3.2, .95, -.6]}><meshStandardMaterial color="#d9d0c3" roughness={.7} /></RoundedBox>
    {[-.65, .65].map((x) => <mesh key={x} position={[3.2 + x, .5, -.6]}><cylinderGeometry args={[.06, .06, .8, 10]} /><meshStandardMaterial color="#333c40" metalness={.8} roughness={.25} /></mesh>)}
    <RoundedBox args={[3.6, .08, .8]} radius={.03} position={[2.1, 2.15, -2.7]}><meshStandardMaterial color="#e5dfd4" roughness={.55} /></RoundedBox>
    <mesh position={[0, 2.2, -3.1]}><boxGeometry args={[7.5, 4.2, .12]} /><meshStandardMaterial color="#718a8f" roughness={.18} metalness={.45} /></mesh>
    <mesh position={[0, 2.2, -3.03]}><boxGeometry args={[6.9, 3.55, .08]} /><meshStandardMaterial color="#99c0c4" roughness={.08} metalness={.35} /></mesh>
  </group>;
}

function Interior({ selectedUnit, night }) {
  const glow = night ? '#d6a75e' : '#9ac2c8';
  return <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -.02, 0]} receiveShadow><planeGeometry args={[15, 15]} /><meshStandardMaterial color="#c9c1b6" roughness={.58} /></mesh>
    <mesh position={[0, 3.8, -5.8]}><boxGeometry args={[15, 7.6, .18]} /><meshStandardMaterial color="#eee9e0" roughness={.72} /></mesh>
    <mesh position={[-7.4, 3.8, 0]}><boxGeometry args={[.18, 7.6, 12]} /><meshStandardMaterial color="#e4ddd2" roughness={.75} /></mesh>
    <mesh position={[7.4, 3.8, 0]}><boxGeometry args={[.18, 7.6, 12]} /><meshStandardMaterial color="#e4ddd2" roughness={.75} /></mesh>
    <Furniture mode="interior" />
    <pointLight position={[0, 3.5, -2]} intensity={night ? 18 : 5} distance={12} color={glow} />
    <pointLight position={[4, 2.8, 1]} intensity={night ? 10 : 2} distance={8} color="#f4d2a0" />
    <Text position={[0, 5.9, -5.65]} fontSize={.34} color="#24343b" anchorX="center" anchorY="middle">{selectedUnit ? `UNIDAD ${selectedUnit.number}` : 'SHOW APARTMENT'}</Text>
  </group>;
}

function Building({ selectedFloor, selectedUnit, night, onSelectUnit }) {
  const floorH = 2.55;
  const max = Math.max(...floors, 12);
  return <group>
    <RoundedBox args={[20, 4, 14]} radius={.55} smoothness={6} position={[0, 2, 0]} castShadow receiveShadow><meshStandardMaterial color="#77766f" roughness={.7} /></RoundedBox>
    <RoundedBox args={[18.8, 1, 13]} radius={.3} smoothness={5} position={[0, 4.5, 0]} castShadow><meshStandardMaterial color="#d7d0c6" roughness={.55} /></RoundedBox>
    {Array.from({ length: max }).map((_, index) => {
      const floor = floors[index] ?? index + 1;
      const y = 6 + index * floorH;
      const focused = selectedFloor == null || selectedFloor === floor;
      const opacity = focused ? 1 : .08;
      const floorUnits = units.filter((u) => u.floor === floor);
      return <group key={floor} position={[0, y, 0]}>
        <mesh position={[0, 0, 0]}><boxGeometry args={[19.2, .16, 13.4]} /><meshStandardMaterial color={selectedFloor === floor ? '#d1ad66' : '#aaa69f'} transparent opacity={opacity} /></mesh>
        <mesh position={[0, 0, 0]}><boxGeometry args={[.32, floorH, 12.8]} /><meshStandardMaterial color="#e3ded6" transparent opacity={opacity} /></mesh>
        {floorUnits.map((unit, i) => {
          const x = -6.3 + (i % 4) * 4.2;
          const active = selectedUnit?.id === unit.id;
          return <group key={unit.id} position={[x, 0, 6.48]}>
            <mesh onClick={(e) => { e.stopPropagation(); onSelectUnit(unit); }}>
              <boxGeometry args={[3.45, 1.8, .16]} /><meshStandardMaterial color={night ? '#c79a55' : '#6e9aa2'} roughness={.12} metalness={.65} emissive={statusColor(unit.status, active)} emissiveIntensity={active ? .9 : .05} transparent opacity={opacity} />
            </mesh>
            <mesh position={[0, -.95, .18]}><boxGeometry args={[3.65, .12, 1.2]} /><meshStandardMaterial color="#b9a993" roughness={.7} transparent opacity={opacity} /></mesh>
            {active && <Text position={[0, 1.35, .3]} fontSize={.28} color="#fff" outlineWidth={.025} outlineColor="#18272e" anchorX="center">{unit.number}</Text>}
          </group>;
        })}
      </group>;
    })}
    <RoundedBox args={[16, .45, 7]} radius={.2} position={[0, 5.05, 7.4]}><meshStandardMaterial color="#b9aa98" roughness={.7} /></RoundedBox>
    <RoundedBox args={[12, .08, 5.2]} radius={.12} position={[0, 5.33, 7.4]}><meshStandardMaterial color="#6ca7ae" roughness={.1} metalness={.3} /></RoundedBox>
    <mesh position={[0, 6.6, 7.4]}><boxGeometry args={[10.5, .1, 4.5]} /><meshStandardMaterial color="#d6c8b4" roughness={.65} /></mesh>
  </group>;
}

function Site({ night }) {
  return <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -.1, 0]} receiveShadow><planeGeometry args={[150, 150]} /><meshStandardMaterial color={night ? '#172428' : '#8ea18d'} roughness={1} /></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 52]}><planeGeometry args={[120, 45]} /><meshStandardMaterial color="#4e8a97" roughness={.55} /></mesh>
    <RoundedBox args={[11, .14, 55]} radius={.1} position={[0, .05, 17]}><meshStandardMaterial color="#666966" roughness={.95} /></RoundedBox>
    <RoundedBox args={[7, .16, 55]} radius={.1} position={[0, .15, 17]}><meshStandardMaterial color="#d4c9b7" roughness={.95} /></RoundedBox>
    {[[-27, 0, 18], [27, 0, 18], [-29, 0, -12], [29, 0, -12], [-25, 0, 38], [25, 0, 39]].map(([x, y, z], i) => <Tree key={i} position={[x, y, z]} scale={1 + (i % 2) * .25} />)}
    {[[-24, 0, 28], [24, 0, 30], [-24, 0, -2], [24, 0, 0]].map(([x, y, z], i) => <group key={i} position={[x, y, z]}><RoundedBox args={[11, 4, 8]} radius={.3} position={[0, 2, 0]}><meshStandardMaterial color="#a6a198" roughness={.8} /></RoundedBox><mesh position={[0, 2.3, 4.05]}><boxGeometry args={[8, 1.6, .12]} /><meshStandardMaterial color={night ? '#c39b5c' : '#73959a'} metalness={.55} roughness={.15} emissive={night ? '#8c5e25' : '#143d45'} emissiveIntensity={night ? .3 : .03} /></mesh></group>)}
  </group>;
}

function Camera({ mode, controls }) {
  const presets = useMemo(() => ({
    hero: [[42, 27, 47], [0, 14, 8]],
    approach: [[25, 12, 35], [0, 12, 4]],
    building: [[25, 17, 29], [0, 17, 0]],
    floor: [[17, 10, 20], [0, 19, 5]],
    amenity: [[20, 8, 25], [0, 5, 10]],
    roof: [[30, 29, 34], [0, 23, 0]],
    interior: [[10, 5.5, 13], [0, 2.2, -2]],
  }), []);
  useFrame(({ camera }) => {
    const [p, t] = presets[mode] ?? presets.hero;
    camera.position.lerp(new Vector3(...p), mode === 'interior' ? .035 : .045);
    if (controls.current) controls.current.target.lerp(new Vector3(...t), .045);
  });
  return null;
}

function Scene({ mode, selectedFloor, selectedUnit, night, tour, onSelectUnit }) {
  const controls = useRef();
  return <Canvas shadows dpr={[1, 1.8]} camera={{ position: [42, 27, 47], fov: 34 }} gl={{ antialias: true, powerPreference: 'high-performance' }}>
    <color attach="background" args={[night ? '#08151b' : '#9ebdc3']} />
    <fog attach="fog" args={[night ? '#08151b' : '#9ebdc3', 55, 125]} />
    <ambientLight intensity={night ? .28 : 1.15} />
    <directionalLight castShadow position={[22, 38, 16]} intensity={night ? 1.1 : 3.2} color={night ? '#f0c47a' : '#fff0d1'} shadow-mapSize-width={2048} shadow-mapSize-height={2048} />
    <Environment preset="city" />
    <Sky distance={450000} sunPosition={night ? [-5, -2, 3] : [8, 8, 5]} inclination={night ? .86 : .47} azimuth={.24} />
    {mode === 'interior' ? <Interior selectedUnit={selectedUnit} night={night} /> : <><Site night={night} /><Building selectedFloor={selectedFloor} selectedUnit={selectedUnit} night={night} onSelectUnit={onSelectUnit} /><ContactShadows position={[0, 0, 0]} scale={80} blur={2.8} far={60} opacity={night ? .25 : .4} /></>}
    <Camera mode={mode} controls={controls} />
    <OrbitControls ref={controls} enableDamping dampingFactor={.06} minDistance={mode === 'interior' ? 4 : 10} maxDistance={mode === 'interior' ? 20 : 75} maxPolarAngle={Math.PI / 2.02} autoRotate={tour && mode !== 'interior'} autoRotateSpeed={.22} />
  </Canvas>;
}

export default function CinematicShowroomV2() {
  const [mode, setMode] = useState('hero');
  const [selectedFloor, setSelectedFloor] = useState(null);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [night, setNight] = useState(false);
  const [tour, setTour] = useState(false);
  const [finder, setFinder] = useState('ALL');
  const [showUnits, setShowUnits] = useState(false);
  const available = units.filter((u) => u.status === 'AVAILABLE').length;
  const types = [...new Set(units.map((u) => u.type))];

  useEffect(() => {
    if (!tour) return;
    const sequence = ['hero', 'approach', 'building', 'amenity', 'roof'];
    let index = 0;
    const timer = setInterval(() => { index = (index + 1) % sequence.length; setMode(sequence[index]); }, 5000);
    return () => clearInterval(timer);
  }, [tour]);

  const selectUnit = (unit) => { setSelectedUnit(unit); setSelectedFloor(unit.floor); setMode('floor'); };
  const filtered = finder === 'ALL' ? units : units.filter((u) => u.type === finder);

  return <div className="v2-showroom">
    <header className="v2-nav">
      <div className="v2-brand"><span>OM</span><div><b>OCEAN MANSIONS</b><small>PUNTA DEL ESTE · DIGITAL SHOWROOM</small></div></div>
      <nav><button className={mode !== 'interior' ? 'active' : ''} onClick={() => setMode('hero')}>Proyecto</button><button onClick={() => setMode('building')}>Edificio</button><button onClick={() => setMode('amenity')}>Amenities</button><button onClick={() => setMode('interior')}>Interior 360°</button></nav>
      <div className="v2-actions"><button onClick={() => setNight((v) => !v)}>{night ? 'Día' : 'Noche'}</button><button className="v2-contact">Consultar</button></div>
    </header>

    <section className="v2-stage">
      <Scene mode={mode} selectedFloor={selectedFloor} selectedUnit={selectedUnit} night={night} tour={tour} onSelectUnit={selectUnit} />
      <div className="v2-film" />
      <div className="v2-copy"><span>PLAYA MANSA · PUNTA DEL ESTE</span><h1>Ocean<br/><i>Mansions</i></h1><p>Una nueva forma de recorrer un proyecto inmobiliario antes de que exista.</p><div className="v2-buttons"><button onClick={() => setMode('building')}>Explorar proyecto <b>↗</b></button><button className="ghost" onClick={() => setTour((v) => !v)}>{tour ? 'Detener recorrido' : 'Iniciar recorrido'}</button></div></div>
      <div className="v2-scene-label"><b>{mode === 'interior' ? 'SHOW APARTMENT' : mode.toUpperCase()}</b><span /> INTERACTIVE ARCHVIZ</div>
      <div className="v2-bottom"><span><b>{units.length}</b> unidades</span><span><b>{available}</b> disponibles</span><span><b>{floors.length}</b> niveles</span><span><b>USD 245K</b> desde</span></div>
      <div className="v2-floor-rail"><small>PISOS</small>{floors.map((floor) => <button key={floor} className={selectedFloor === floor ? 'on' : ''} onClick={() => { setSelectedFloor(floor); setMode('floor'); }}>{String(floor).padStart(2, '0')}</button>)}</div>
      {selectedUnit && <aside className="v2-unit-card"><button className="x" onClick={() => setSelectedUnit(null)}>×</button><small>UNIDAD {selectedUnit.number} · PISO {selectedUnit.floor}</small><h2>{selectedUnit.type}</h2><strong>{money.format(selectedUnit.price)}</strong><div><span>{selectedUnit.area ?? selectedUnit.surface} m²</span><span>{selectedUnit.bedrooms} dorm.</span><span>{selectedUnit.bathrooms} baños</span></div><button onClick={() => setMode('interior')}>Entrar a la unidad ↗</button></aside>}
    </section>

    <section className="v2-story"><div><small>01 · LIVE MODEL</small><h2>No estás mirando<br/><i>un render.</i></h2></div><p>El edificio, los pisos, las unidades y los amenities están conectados a la misma experiencia. La cámara se convierte en la forma de recorrer el proyecto y la disponibilidad deja de ser una tabla aislada.</p><button onClick={() => setMode('building')}>Ver el edificio</button></section>

    <section className="v2-inventory"><div className="v2-section-title"><small>02 · APARTMENT FINDER</small><h2>Elegí dónde<br/><i>querés vivir.</i></h2><p>Filtrá por tipología y entrá directamente a una unidad.</p></div><div className="v2-filters"><button className={finder === 'ALL' ? 'active' : ''} onClick={() => setFinder('ALL')}>Todas</button>{types.map((type) => <button key={type} className={finder === type ? 'active' : ''} onClick={() => setFinder(type)}>{type}</button>)}<span>{filtered.length} unidades</span></div><div className="v2-unit-grid">{filtered.slice(0, 16).map((u) => <button key={u.id} onClick={() => selectUnit(u)}><div><b>{u.number}</b><i className={u.status.toLowerCase()} /></div><span>{u.type} · piso {u.floor}</span><strong>{money.format(u.price)}</strong><small>{u.area ?? u.surface} m² · {u.bedrooms} dormitorios</small></button>)}</div></section>

    <section className="v2-amenities"><div><small>03 · LIFESTYLE</small><h2>Viví también<br/><i>afuera.</i></h2></div><div className="v2-amenity-cards">{(project.amenities ?? []).map((a, i) => <article key={a.id} onClick={() => setMode(i === 0 ? 'amenity' : 'building')}><small>0{i + 1}</small><h3>{a.name}</h3><p>{a.description}</p><span>Explorar ↗</span></article>)}</div></section>

    <section className="v2-final"><small>OCEAN MANSIONS · PUNTA DEL ESTE</small><h2>Tu próxima<br/><i>vista.</i></h2><button onClick={() => window.open('https://wa.me/?text=Hola%2C%20quiero%20informacion%20de%20Ocean%20Mansions', '_blank')}>Solicitar información ↗</button></section>
  </div>;
}
