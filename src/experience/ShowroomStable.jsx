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

function Tree({ position = [0, 0, 0], scale = 1 }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 1.5, 0]} castShadow><cylinderGeometry args={[0.12, 0.18, 3, 8]} /><meshStandardMaterial color="#765d47" roughness={1} /></mesh>
      <mesh position={[0, 3.4, 0]} castShadow><icosahedronGeometry args={[1.5, 1]} /><meshStandardMaterial color="#536e5c" roughness={.9} /></mesh>
      <mesh position={[.65, 2.9, .2]} castShadow><icosahedronGeometry args={[.85, 1]} /><meshStandardMaterial color="#617a65" roughness={.9} /></mesh>
    </group>
  );
}

function Palm({ position = [0, 0, 0], scale = 1 }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 2.3, 0]} castShadow><cylinderGeometry args={[.08, .14, 4.6, 8]} /><meshStandardMaterial color="#80674d" roughness={1} /></mesh>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <mesh key={i} position={[Math.sin(i) * .5, 4.5 + Math.cos(i) * .15, Math.cos(i) * .5]} rotation={[.35, i, -.3]} castShadow>
          <boxGeometry args={[.16, .12, 2.1]} /><meshStandardMaterial color="#66816b" roughness={.85} />
        </mesh>
      ))}
    </group>
  );
}

function Tower({ selected, onSelect, night }) {
  const floors = useMemo(() => Array.from({ length: 12 }, (_, i) => i + 1), []);
  return (
    <group>
      <mesh position={[0, -0.5, 0]} receiveShadow><boxGeometry args={[30, 1, 21]} /><meshStandardMaterial color="#b7a795" roughness={.78} /></mesh>
      <mesh position={[0, .15, 0]} castShadow><boxGeometry args={[21, .9, 13]} /><meshStandardMaterial color="#cfc4b5" roughness={.58} /></mesh>
      <mesh position={[0, .65, 5.1]}><boxGeometry args={[18, .08, .08]} /><meshStandardMaterial color="#f0e8dc" roughness={.3} /></mesh>
      {floors.map((floor) => (
        <group key={floor} position={[0, floor * 2.35, 0]}>
          <mesh castShadow receiveShadow><boxGeometry args={[18, 2.04, 9.6]} /><meshStandardMaterial color="#ded6ca" roughness={.4} metalness={.06} /></mesh>
          <mesh position={[0, -.78, 5.0]} castShadow><boxGeometry args={[19.2, .13, 1.15]} /><meshStandardMaterial color="#b8aa98" roughness={.58} /></mesh>
          <mesh position={[0, -.72, 4.98]}><boxGeometry args={[17.7, .05, .06]} /><meshStandardMaterial color="#eee6da" roughness={.3} /></mesh>
          {[-6.2, -2.1, 2.1, 6.2].map((x, col) => {
            const unit = units[(floor - 1) * 4 + col];
            const active = selected?.id === unit.id;
            return (
              <group key={unit.id} position={[x, .08, 4.84]} onClick={() => onSelect(unit)}>
                <mesh castShadow><boxGeometry args={[3.45, 1.55, .12]} /><meshStandardMaterial color={active ? '#e2b85f' : unit.status === 'Disponible' ? '#73989d' : '#5c6666'} emissive={active ? '#9d6817' : unit.status === 'Disponible' && night ? '#183c43' : '#000'} emissiveIntensity={active ? .8 : night && unit.status === 'Disponible' ? .65 : 0} roughness={.14} metalness={.35} /></mesh>
                <mesh position={[0, -.92, -.02]}><boxGeometry args={[3.45, .07, .08]} /><meshStandardMaterial color="#aa9b88" roughness={.5} /></mesh>
              </group>
            );
          })}
        </group>
      ))}
      <mesh position={[0, 29, 0]} castShadow><boxGeometry args={[19, .8, 11]} /><meshStandardMaterial color="#e6ddd0" roughness={.36} /></mesh>
      <mesh position={[0, 29.5, 0]}><boxGeometry args={[15, .14, 7]} /><meshStandardMaterial color="#62aab1" roughness={.08} metalness={.2} /></mesh>
      <mesh position={[0, 30, 0]}><boxGeometry args={[10, .12, 2.8]} /><meshStandardMaterial color="#eee7dc" roughness={.28} /></mesh>
    </group>
  );
}

function Landscape({ night }) {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]} receiveShadow><planeGeometry args={[150, 150]} /><meshStandardMaterial color={night ? '#18282a' : '#768b7d'} roughness={.94} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -.94, 60]}><planeGeometry args={[150, 48]} /><meshStandardMaterial color={night ? '#17434b' : '#4d929c'} roughness={.16} metalness={.2} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -.82, 4]}><planeGeometry args={[34, 13]} /><meshStandardMaterial color="#c7b9a7" roughness={.9} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -.74, 10]}><planeGeometry args={[22, 8]} /><meshStandardMaterial color={night ? '#173a40' : '#68aeb4'} roughness={.08} metalness={.18} /></mesh>
      {[-20, -15, 18, 24].map((x, i) => <Tree key={x} position={[x, -.85, 3 + (i % 2) * 5]} scale={1.1 + (i % 3) * .18} />)}
      {[-11, 11].map((x) => <Palm key={x} position={[x, -.8, 8]} scale={.85} />)}
      <mesh position={[0, .2, 18]} rotation={[0, 0, 0]}><boxGeometry args={[42, .25, .35]} /><meshStandardMaterial color="#dfd4c4" roughness={.65} /></mesh>
    </group>
  );
}

function Scene({ selected, onSelect, night }) {
  return (
    <Canvas shadows dpr={[1, 1.5]} camera={{ position: [39, 20, 44], fov: 34 }} gl={{ antialias: true, powerPreference: 'high-performance' }} style={{ width: '100%', height: '100%' }}>
      <color attach="background" args={[night ? '#071316' : '#9dbdc0']} />
      <fog attach="fog" args={[night ? '#071316' : '#a9c5c5', 48, 125]} />
      <hemisphereLight intensity={night ? .55 : 1.55} groundColor={night ? '#101c1e' : '#66796e'} color={night ? '#8faeb4' : '#fffaf2'} />
      <directionalLight position={[-24, 38, 22]} intensity={night ? 1.8 : 4.5} castShadow shadow-mapSize={[2048, 2048]} />
      <directionalLight position={[24, 16, -16]} intensity={night ? .75 : 1.1} />
      <Landscape night={night} />
      <Tower selected={selected} onSelect={onSelect} night={night} />
      <OrbitControls enableDamping dampingFactor={.055} minDistance={15} maxDistance={78} maxPolarAngle={Math.PI / 2.02} target={[0, 13, 4]} />
    </Canvas>
  );
}

export default function ShowroomStable() {
  const [selected, setSelected] = useState(null);
  const [night, setNight] = useState(false);
  const [floor, setFloor] = useState('Todos');
  const [activeExperience, setActiveExperience] = useState('3D interactivo');
  const filtered = floor === 'Todos' ? units : units.filter((unit) => String(unit.floor) === floor);
  const available = units.filter((u) => u.status === 'Disponible').length;

  return (
    <main className={`stableShowroom ${night ? 'isNight' : ''}`}>
      <section className="stableHero">
        <div className="stableCanvas"><Scene selected={selected} onSelect={setSelected} night={night} /></div>
        <div className="stableAtmosphere" />
        <header className="stableNav">
          <div className="stableBrand"><span>OM</span><div><b>OCEAN MANSIONS</b><small>PUNTA DEL ESTE · PLAYA MANSA</small></div></div>
          <nav><a href="#proyecto">Proyecto</a><a href="#unidades">Unidades</a><a href="#experiencia">Experiencia</a></nav>
          <button className="modeButton" onClick={() => setNight((v) => !v)}><span>{night ? '☼' : '◐'}</span>{night ? 'Día' : 'Noche'}</button>
        </header>
        <div className="heroRail"><span>01</span><i /><span>04</span></div>
        <div className="stableCopy">
          <p className="stableEyebrow">PUNTA DEL ESTE · URUGUAY</p>
          <h1>Ocean<br /><i>Mansions.</i></h1>
          <p>Una nueva forma de recorrer, entender y elegir una propiedad frente al mar.</p>
          <div className="stableButtons"><a href="#unidades">Ver unidades <span>↗</span></a><a className="ghost" href="#experiencia">Explorar proyecto <span>↓</span></a></div>
        </div>
        <div className="heroLocation"><span>18 de Julio · Playa Mansa</span><b>—</b><span>34°54' S · 54°57' O</span></div>
        <div className="stableStats"><span><b>12</b>Pisos</span><span><b>48</b>Unidades</span><span><b>{available}</b>Disponibles</span><span><b>2027</b>Entrega</span></div>
        {selected && <aside className="stableCard"><button onClick={() => setSelected(null)}>×</button><small>UNIDAD {selected.number} · PISO {selected.floor}</small><h2>{selected.status}</h2><p>{selected.surface} m² · {selected.bedrooms} dormitorios</p><strong>US$ {selected.price.toLocaleString('en-US')}</strong><a href="#unidades">Consultar unidad <span>↗</span></a></aside>}
      </section>

      <section id="proyecto" className="stableSection intro">
        <div className="introVisual"><div className="visualLabel">OCEAN MANSIONS / 01</div><div className="visualTower"><span>12</span><i>FLOORS</i></div></div>
        <div className="introText"><p className="stableEyebrow">EL PROYECTO</p><h2>La propiedad<br /><i>se recorre.</i></h2><p>Arquitectura, disponibilidad e información comercial en una sola experiencia digital. Un showroom pensado para que cada decisión empiece antes de la visita.</p><div className="textLink">Conocé el proyecto <span>↗</span></div></div>
      </section>

      <section id="unidades" className="stableSection inventory">
        <div className="sectionTop"><div><p className="stableEyebrow">INVENTARIO EN TIEMPO REAL</p><h2>Encontrá tu <i>unidad.</i></h2></div><div className="inventoryControl"><span>FILTRAR POR PISO</span><select value={floor} onChange={(e) => setFloor(e.target.value)}><option>Todos</option>{Array.from({ length: 12 }, (_, i) => <option key={i + 1}>{i + 1}</option>)}</select></div></div>
        <div className="unitGrid">{filtered.map((unit) => <button key={unit.id} className={selected?.id === unit.id ? 'selected' : ''} onClick={() => setSelected(unit)}><div className="unitTop"><b>{unit.number}</b><small>{unit.status}</small></div><span>Piso {unit.floor} · {unit.surface} m² · {unit.bedrooms} dormitorios</span><strong>US$ {unit.price.toLocaleString('en-US')}</strong><em>Ver unidad ↗</em></button>)}</div>
      </section>

      <section id="experiencia" className="stableSection experience">
        <div className="experienceLead"><p className="stableEyebrow">DIGITAL PROPERTY EXPERIENCE</p><h2>Antes de comprar,<br /><i>vivila.</i></h2><p>El showroom transforma una ficha inmobiliaria en un recorrido completo: edificio, interiores, amenities, planos, inventario y ubicación.</p></div>
        <div className="experiencePanel"><div className="experienceTabs">{['3D interactivo', 'Interiores', 'Amenities', 'Ubicación'].map((item, i) => <button key={item} className={activeExperience === item ? 'active' : ''} onClick={() => setActiveExperience(item)}><span>0{i + 1}</span>{item}</button>)}</div><div className="experienceDetail"><small>EXPERIENCIA / {activeExperience.toUpperCase()}</small><h3>{activeExperience === '3D interactivo' ? 'Recorré la arquitectura.' : activeExperience === 'Interiores' ? 'Entrá antes de visitar.' : activeExperience === 'Amenities' ? 'Descubrí cómo se vive.' : 'Entendé dónde estás comprando.'}</h3><p>Una capa digital diseñada para reducir fricción comercial y darle al proyecto una presencia acorde a su valor.</p></div></div>
      </section>
      <footer className="stableFooter"><span>OCEAN MANSIONS</span><span>PUNTA DEL ESTE · URUGUAY</span><span>SHOWROOM 01 / 01</span></footer>
    </main>
  );
}
