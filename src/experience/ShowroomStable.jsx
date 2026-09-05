import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useMemo, useState } from 'react';

const units = Array.from({ length: 48 }, (_, i) => ({
  id: i + 1,
  number: `${Math.floor(i / 4) + 1}${String((i % 4) + 1).padStart(2, '0')}`,
  floor: Math.floor(i / 4) + 1,
  bedrooms: i % 3 === 0 ? 4 : i % 2 === 0 ? 3 : 2,
  surface: i % 3 === 0 ? 168 : i % 2 === 0 ? 132 : 104,
  price: i % 3 === 0 ? 720000 : i % 2 === 0 ? 560000 : 430000,
  status: i % 7 === 0 ? 'Reservado' : i % 11 === 0 ? 'Vendida' : 'Disponible',
}));

function Tower({ selected, onSelect }) {
  const floors = useMemo(() => Array.from({ length: 12 }, (_, i) => i + 1), []);
  return (
    <group>
      <mesh position={[0, -0.5, 0]} receiveShadow>
        <boxGeometry args={[26, 1, 18]} />
        <meshStandardMaterial color="#b9ad9c" roughness={0.8} />
      </mesh>
      {floors.map((floor) => (
        <group key={floor} position={[0, floor * 2.35, 0]}>
          <mesh castShadow>
            <boxGeometry args={[17, 2.05, 9]} />
            <meshStandardMaterial color="#ddd6cb" roughness={0.48} metalness={0.05} />
          </mesh>
          {[-6, -2, 2, 6].map((x, col) => {
            const unit = units[(floor - 1) * 4 + col];
            const active = selected?.id === unit.id;
            return (
              <mesh key={unit.id} position={[x, 0, 4.62]} onClick={() => onSelect(unit)}>
                <boxGeometry args={[3.25, 1.55, 0.12]} />
                <meshStandardMaterial
                  color={active ? '#d7a653' : unit.status === 'Disponible' ? '#789da1' : '#626866'}
                  emissive={active ? '#8b5d16' : '#000000'}
                  emissiveIntensity={active ? 0.6 : 0}
                  roughness={0.18}
                  metalness={0.15}
                />
              </mesh>
            );
          })}
        </group>
      ))}
      <mesh position={[0, 29, 0]} castShadow>
        <boxGeometry args={[18, 0.8, 10]} />
        <meshStandardMaterial color="#e4dacb" roughness={0.42} />
      </mesh>
      <mesh position={[0, 29.45, 1]}>
        <boxGeometry args={[14, 0.12, 6]} />
        <meshStandardMaterial color="#65aeb5" roughness={0.08} metalness={0.15} />
      </mesh>
    </group>
  );
}

function Scene({ selected, onSelect, night }) {
  return (
    <Canvas
      shadows
      dpr={[1, 1.5]}
      camera={{ position: [34, 22, 38], fov: 35 }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      style={{ width: '100%', height: '100%' }}
    >
      <color attach="background" args={[night ? '#081316' : '#9fbfc1']} />
      <fog attach="fog" args={[night ? '#081316' : '#a7c6c8', 45, 120]} />
      <ambientLight intensity={night ? 0.5 : 1.35} />
      <directionalLight position={[-20, 35, 18]} intensity={night ? 2 : 4} castShadow />
      <directionalLight position={[18, 12, -18]} intensity={night ? 0.7 : 1.2} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]} receiveShadow>
        <planeGeometry args={[150, 150]} />
        <meshStandardMaterial color={night ? '#16272a' : '#718a7c'} roughness={0.92} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.95, 58]}>
        <planeGeometry args={[150, 45]} />
        <meshStandardMaterial color={night ? '#16424a' : '#4e929d'} roughness={0.2} />
      </mesh>
      <Tower selected={selected} onSelect={onSelect} />
      <OrbitControls enableDamping dampingFactor={0.06} minDistance={14} maxDistance={75} maxPolarAngle={Math.PI / 2.02} />
    </Canvas>
  );
}

export default function ShowroomStable() {
  const [selected, setSelected] = useState(null);
  const [night, setNight] = useState(false);
  const [floor, setFloor] = useState('Todos');
  const filtered = floor === 'Todos' ? units : units.filter((unit) => String(unit.floor) === floor);

  return (
    <main className={`stableShowroom ${night ? 'isNight' : ''}`}>
      <section className="stableHero">
        <div className="stableCanvas"><Scene selected={selected} onSelect={setSelected} night={night} /></div>
        <div className="stableOverlay" />
        <header className="stableNav">
          <div className="stableBrand"><span>OM</span><div><b>OCEAN MANSIONS</b><small>PUNTA DEL ESTE · PLAYA MANSA</small></div></div>
          <nav><a href="#proyecto">Proyecto</a><a href="#unidades">Unidades</a><a href="#experiencia">Experiencia</a></nav>
          <button onClick={() => setNight((v) => !v)}>{night ? 'Día' : 'Noche'}</button>
        </header>
        <div className="stableCopy">
          <p className="stableEyebrow">Punta del Este · Uruguay</p>
          <h1>Ocean<br /><i>Mansions.</i></h1>
          <p>Una nueva forma de recorrer, entender y elegir una propiedad frente al mar.</p>
          <div className="stableButtons"><a href="#unidades">Ver unidades</a><a className="ghost" href="#experiencia">Explorar proyecto</a></div>
        </div>
        <div className="stableStats"><span><b>12</b>Pisos</span><span><b>48</b>Unidades</span><span><b>{units.filter((u) => u.status === 'Disponible').length}</b>Disponibles</span></div>
        {selected && <aside className="stableCard"><button onClick={() => setSelected(null)}>×</button><small>UNIDAD {selected.number} · PISO {selected.floor}</small><h2>{selected.status}</h2><p>{selected.surface} m² · {selected.bedrooms} dormitorios</p><strong>US$ {selected.price.toLocaleString('en-US')}</strong><a href="#unidades">Consultar unidad</a></aside>}
      </section>

      <section id="proyecto" className="stableSection intro"><p className="stableEyebrow">EL PROYECTO</p><h2>La propiedad<br /><i>se recorre.</i></h2><p>Arquitectura, disponibilidad e información comercial en una sola experiencia digital.</p></section>

      <section id="unidades" className="stableSection inventory"><div className="sectionTop"><div><p className="stableEyebrow">INVENTARIO</p><h2>Encontrá tu <i>unidad.</i></h2></div><select value={floor} onChange={(e) => setFloor(e.target.value)}><option>Todos</option>{Array.from({ length: 12 }, (_, i) => <option key={i + 1}>{i + 1}</option>)}</select></div><div className="unitGrid">{filtered.map((unit) => <button key={unit.id} className={selected?.id === unit.id ? 'selected' : ''} onClick={() => setSelected(unit)}><b>{unit.number}</b><span>Piso {unit.floor} · {unit.surface} m² · {unit.bedrooms} dorm.</span><strong>US$ {unit.price.toLocaleString('en-US')}</strong><small>{unit.status}</small></button>)}</div></section>

      <section id="experiencia" className="stableSection experience"><div><p className="stableEyebrow">DIGITAL PROPERTY EXPERIENCE</p><h2>Antes de comprar,<br /><i>vivila.</i></h2><p>El showroom está pensado para que una propiedad deje de ser un PDF y se convierta en una experiencia.</p></div><div className="experienceFacts"><span>3D interactivo</span><span>Inventario</span><span>Interiores</span><span>Amenities</span><span>Ubicación</span></div></section>
    </main>
  );
}
