import { Canvas, useFrame } from '@react-three/fiber';
import {
  ContactShadows,
  Environment,
  OrbitControls,
  RoundedBox,
  Sky,
  Stats,
} from '@react-three/drei';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import ContactForm from '../components/ContactForm';
import { getProjectById } from '../platform/projectRegistry';
import './showroom-cinematic.css';

const project = getProjectById();
const units = project.units ?? [];
const floors = [...new Set(units.map((item) => item.floor))].sort((a, b) => a - b);
const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});
const statusText = { AVAILABLE: 'Disponible', RESERVED: 'Reservado', SOLD: 'Vendida' };
const statusClass = { AVAILABLE: 'available', RESERVED: 'reserved', SOLD: 'sold' };
const scenes = ['hero', 'building', 'floor', 'interior', 'amenities', 'contact'];
const sceneText = {
  hero: 'Llegada',
  building: 'Torre',
  floor: 'Inventario',
  interior: 'Interior',
  amenities: 'Amenities',
  contact: 'Contacto',
};

function Palm({ position, scale = 1 }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 1.8, 0]} castShadow>
        <cylinderGeometry args={[0.11, 0.2, 3.6, 8]} />
        <meshStandardMaterial color="#624c3d" roughness={0.9} />
      </mesh>
      {Array.from({ length: 7 }).map((_, index) => (
        <mesh
          key={index}
          position={[0, 3.55, 0]}
          rotation={[0.35, index * 0.9, -0.4]}
          castShadow
        >
          <boxGeometry args={[0.18, 2.2, 0.08]} />
          <meshStandardMaterial color="#3f664e" roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
}

function GlassPane({ position, size, active = true, warm = false }) {
  return (
    <mesh position={position} castShadow={false}>
      <boxGeometry args={size} />
      <meshPhysicalMaterial
        color={warm ? '#b68a52' : active ? '#6f9da4' : '#42585b'}
        roughness={0.1}
        metalness={0.08}
        transmission={0.12}
        transparent
        opacity={active ? 0.82 : 0.18}
        emissive={warm ? '#7f4e20' : '#102d32'}
        emissiveIntensity={warm ? 0.7 : 0.08}
      />
    </mesh>
  );
}

function Tower({ floor, onSelect, night }) {
  const levels = 12;
  const levelHeight = 2.55;
  const floorBase = 5.7;
  const width = 20;
  const depth = 12.5;

  return (
    <group>
      <RoundedBox args={[22, 4.8, 14]} radius={0.75} position={[0, 2.4, 0]} castShadow>
        <meshStandardMaterial color="#777875" roughness={0.55} metalness={0.08} />
      </RoundedBox>

      <RoundedBox args={[17.5, 1.15, 9.5]} radius={0.3} position={[0, 5.1, 0]} castShadow>
        <meshStandardMaterial color="#d7cfc2" roughness={0.55} />
      </RoundedBox>

      {Array.from({ length: levels }).map((_, index) => {
        const level = index + 1;
        const y = floorBase + index * levelHeight;
        const active = floor == null || floor === level;
        const floorUnits = units.filter((item) => item.floor === level);

        return (
          <group key={level} position={[0, y, 0]}>
            <mesh castShadow>
              <boxGeometry args={[width, 0.11, depth]} />
              <meshStandardMaterial
                color={active ? '#d8d0c5' : '#4e5554'}
                roughness={0.5}
                transparent
                opacity={active ? 1 : 0.2}
              />
            </mesh>

            <mesh position={[0, 1.05, -5.95]} castShadow>
              <boxGeometry args={[19.6, 2.05, 0.35]} />
              <meshStandardMaterial
                color={active ? '#d6d0c7' : '#4c5150'}
                roughness={0.58}
                transparent
                opacity={active ? 1 : 0.22}
              />
            </mesh>

            {[-8.9, 8.9].map((x) => (
              <mesh key={x} position={[x, 1.15, 0]} castShadow>
                <boxGeometry args={[0.35, 2.3, depth]} />
                <meshStandardMaterial
                  color="#b8b1a7"
                  roughness={0.62}
                  transparent
                  opacity={active ? 1 : 0.2}
                />
              </mesh>
            ))}

            {[-7.8, -3.9, 0, 3.9, 7.8].map((x, column) => {
              const unit = floorUnits.find(
                (item) => String(item.number).endsWith(String(column + 1)),
              );
              const selected = unit && floor === level;
              const warm = night && unit?.status === 'AVAILABLE';

              return (
                <group key={column}>
                  <GlassPane
                    position={[x, 1.05, 6.28]}
                    size={[3.2, 1.7, 0.12]}
                    active={active}
                    warm={warm}
                  />
                  <mesh
                    position={[x, 1.0, 6.5]}
                    onClick={() => unit && onSelect(unit)}
                    onPointerOver={(event) => {
                      if (unit) event.stopPropagation();
                    }}
                  >
                    <boxGeometry args={[3.35, 1.75, 0.2]} />
                    <meshBasicMaterial
                      color={selected ? '#e5b75f' : '#ffffff'}
                      transparent
                      opacity={selected ? 0.28 : 0}
                    />
                  </mesh>
                  <mesh position={[x, 1.08, 6.58]}>
                    <boxGeometry args={[3.0, 0.06, 0.75]} />
                    <meshStandardMaterial
                      color={selected ? '#c89542' : '#a59f96'}
                      roughness={0.65}
                      transparent
                      opacity={active ? 0.75 : 0.12}
                    />
                  </mesh>
                </group>
              );
            })}
          </group>
        );
      })}

      {[-7.2, 0, 7.2].map((x) => (
        <mesh key={x} position={[x, 20.6, 0]} castShadow>
          <boxGeometry args={[0.22, 31, 0.22]} />
          <meshStandardMaterial color="#b9b1a6" roughness={0.5} metalness={0.12} />
        </mesh>
      ))}

      <RoundedBox args={[18.2, 0.85, 11.5]} radius={0.22} position={[0, 21.55, 0]} castShadow>
        <meshStandardMaterial color="#e2d9cc" roughness={0.48} />
      </RoundedBox>
      <RoundedBox args={[15.5, 0.14, 7.4]} radius={0.12} position={[0, 22.03, 1.1]}>
        <meshStandardMaterial color="#6aa8ad" roughness={0.06} metalness={0.1} />
      </RoundedBox>
      <RoundedBox args={[19, 0.5, 12.8]} radius={0.18} position={[0, 22.25, 0]}>
        <meshStandardMaterial color="#c8c0b5" roughness={0.48} />
      </RoundedBox>
    </group>
  );
}

function Site({ night }) {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
        <planeGeometry args={[180, 180]} />
        <meshStandardMaterial color={night ? '#142326' : '#819185'} roughness={0.9} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 65]}>
        <planeGeometry args={[150, 55]} />
        <meshStandardMaterial color={night ? '#17404a' : '#4c8b97'} roughness={0.18} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 24]}>
        <planeGeometry args={[12, 70]} />
        <meshStandardMaterial color="#d0c3b0" roughness={0.75} />
      </mesh>
      <RoundedBox args={[24, 0.35, 12]} radius={0.4} position={[0, 0.2, 16]}>
        <meshStandardMaterial color="#b6aa99" roughness={0.55} />
      </RoundedBox>
      <RoundedBox args={[21, 0.18, 8]} radius={0.35} position={[0, 0.48, 16]}>
        <meshStandardMaterial color="#61aeb9" roughness={0.08} />
      </RoundedBox>
      <mesh position={[0, 12, 96]}>
        <sphereGeometry args={[8, 32, 32]} />
        <meshBasicMaterial color={night ? '#e6b56e' : '#fff2c9'} transparent opacity={night ? 0.55 : 0.9} />
      </mesh>
      {[-28, -20, 20, 28, -16, 16].map((x, index) => (
        <Palm key={index} position={[x, 0, index < 4 ? 7 : 27]} scale={index % 2 ? 0.9 : 1.1} />
      ))}
    </group>
  );
}

function Interior({ night }) {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[16, 13]} />
        <meshStandardMaterial color="#d9d1c5" roughness={0.7} />
      </mesh>
      <mesh position={[0, 3.6, -6.5]}>
        <boxGeometry args={[16, 7.2, 0.15]} />
        <meshStandardMaterial color="#f0ebe3" roughness={0.6} />
      </mesh>
      <mesh position={[0, 3.3, -6.35]}>
        <boxGeometry args={[14.4, 5.8, 0.1]} />
        <meshPhysicalMaterial color="#7faeb5" transmission={0.25} roughness={0.08} />
      </mesh>
      <RoundedBox args={[5.4, 0.65, 2.3]} radius={0.2} position={[-2, 1.05, 0.8]}>
        <meshStandardMaterial color="#686967" roughness={0.8} />
      </RoundedBox>
      <RoundedBox args={[5, 0.16, 2]} radius={0.1} position={[-2, 1.43, 0.8]}>
        <meshStandardMaterial color="#b99b76" roughness={0.55} />
      </RoundedBox>
      <RoundedBox args={[3.4, 0.18, 1.5]} radius={0.08} position={[3, 1.1, -1.3]}>
        <meshStandardMaterial color="#ded5c8" roughness={0.65} />
      </RoundedBox>
      <pointLight
        position={[0, 3.5, -2]}
        intensity={night ? 22 : 4}
        color={night ? '#ffc56f' : '#fff8ea'}
      />
    </group>
  );
}

function Scene({ mode, floor, night, onSelect }) {
  const controls = useRef();
  const targets = useMemo(
    () => ({
      hero: [[48, 26, 55], [0, 13, 12]],
      building: [[31, 20, 36], [0, 15, 2]],
      floor: [[24, 14, 31], [0, 17, 6]],
      interior: [[10, 6, 12], [0, 2.5, -1]],
      amenities: [[28, 12, 32], [0, 5, 15]],
      contact: [[22, 10, 25], [0, 8, 4]],
    }),
    [],
  );

  useFrame(({ camera }) => {
    const [position, target] = targets[mode] || targets.hero;
    camera.position.lerp(new THREE.Vector3(...position), 0.045);
    controls.current?.target.lerp(new THREE.Vector3(...target), 0.06);
  });

  return (
    <Canvas
      shadows
      dpr={[1, 1.7]}
      camera={{ position: [48, 26, 55], fov: 31 }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
    >
      {import.meta.env.DEV && <Stats />}
      <color attach="background" args={[night ? '#071318' : '#9ebdc0']} />
      <fog attach="fog" args={[night ? '#071318' : '#a9c9cc', 52, 155]} />
      <Sky
        distance={450000}
        sunPosition={night ? [-4, 0.5, -2] : [-3, 2.5, -4]}
        inclination={night ? 0.58 : 0.47}
        azimuth={0.24}
        turbidity={night ? 7 : 5}
        rayleigh={night ? 0.9 : 1.8}
        mieCoefficient={0.006}
        mieDirectionalG={0.82}
      />
      <ambientLight intensity={night ? 0.28 : 1.0} />
      <directionalLight
        castShadow
        position={[-22, 38, 18]}
        intensity={night ? 1.65 : 4.2}
        color={night ? '#ffd49b' : '#fff0d0'}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <Environment preset={night ? 'night' : 'city'} background={false} />
      {mode === 'interior' ? (
        <Interior night={night} />
      ) : (
        <>
          <Site night={night} />
          <Tower floor={floor} onSelect={onSelect} night={night} />
          <ContactShadows
            position={[0, 0, 0]}
            scale={90}
            blur={3}
            far={70}
            opacity={night ? 0.35 : 0.45}
          />
        </>
      )}
      <OrbitControls
        ref={controls}
        enableDamping
        dampingFactor={0.06}
        minDistance={mode === 'interior' ? 4 : 11}
        maxDistance={mode === 'interior' ? 18 : 80}
        maxPolarAngle={Math.PI / 2.04}
      />
    </Canvas>
  );
}

function UnitCard({ unit, onClose, onInterior, onContact }) {
  if (!unit) return null;
  return (
    <article className="unitCard">
      <button className="closeButton" onClick={onClose} aria-label="Cerrar ficha">
        ×
      </button>
      <div className="eyebrow">Unidad {unit.number} · Piso {unit.floor}</div>
      <h3>{statusText[unit.status]}</h3>
      <div className="unitMeta">
        <span>{unit.surface} m²<small>Superficie</small></span>
        <span>{unit.bedrooms}<small>Dormitorios</small></span>
        <span>{unit.bathrooms}<small>Baños</small></span>
        <span>{unit.terrace} m²<small>Terraza</small></span>
      </div>
      <strong className="price">{money.format(unit.price)}</strong>
      <div className="cardActions">
        <button className="button light" onClick={onInterior}>Ver apartamento</button>
        <button className="button outline" onClick={onContact}>Consultar</button>
      </div>
    </article>
  );
}

function MapVisual() {
  return (
    <div className="locationVisual">
      <div className="mapWater" />
      <div className="mapLand" />
      <div className="mapRoad roadOne" />
      <div className="mapRoad roadTwo" />
      <b className="mapPin mainPin">Ocean Mansions</b>
      {['Playa Mansa', 'Puerto', 'Centro', 'Restaurantes', 'Servicios'].map((label, index) => (
        <span key={label} className={`mapPin pin${index}`}>{label}</span>
      ))}
    </div>
  );
}

export default function ShowroomV4() {
  const [mode, setMode] = useState('hero');
  const [floor, setFloor] = useState(null);
  const [unit, setUnit] = useState(null);
  const [night, setNight] = useState(false);
  const [tour, setTour] = useState(false);
  const [filters, setFilters] = useState({ floor: 'Todos', bedrooms: 'Todos', status: 'Todos' });
  const available = units.filter((item) => item.status === 'AVAILABLE').length;
  const filtered = units.filter(
    (item) =>
      (filters.floor === 'Todos' || String(item.floor) === filters.floor) &&
      (filters.bedrooms === 'Todos' || String(item.bedrooms) === filters.bedrooms) &&
      (filters.status === 'Todos' || item.status === filters.status),
  );
  const go = (nextMode, id) => {
    setMode(nextMode);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };
  const selectUnit = (selected) => {
    setUnit(selected);
    setFloor(selected.floor);
    go('floor', 'units');
  };
  const changeFilter = (name, value) => {
    setFilters((current) => ({ ...current, [name]: value }));
    if (name === 'floor') setFloor(value === 'Todos' ? null : Number(value));
  };

  useEffect(() => {
    if (!tour) return undefined;
    let index = 0;
    const timer = setInterval(() => {
      index = (index + 1) % scenes.length;
      setMode(scenes[index]);
    }, 4200);
    return () => clearInterval(timer);
  }, [tour]);

  return (
    <main className={`showroom ${night ? 'night' : ''}`}>
      <section className="stage" id="proyecto">
        <Scene mode={mode} floor={floor} night={night} onSelect={selectUnit} />
        <div className="stageShade" />
        <header className="nav">
          <button className="brand" onClick={() => go('hero', 'proyecto')}>
            <span className="mark">OM</span>
            <span><b>OCEAN MANSIONS</b><small>PUNTA DEL ESTE · PLAYA MANSA</small></span>
          </button>
          <nav className="navlinks">
            {[
              ['Proyecto', 'hero', 'proyecto'],
              ['Arquitectura', 'building', 'arquitectura'],
              ['Unidades', 'floor', 'units'],
              ['Amenities', 'amenities', 'amenities'],
              ['Ubicación', 'contact', 'ubicacion'],
            ].map(([label, nextMode, id]) => (
              <button key={label} className={mode === nextMode ? 'active' : ''} onClick={() => go(nextMode, id)}>{label}</button>
            ))}
          </nav>
          <div className="actions">
            <button className="button outline" onClick={() => setNight((value) => !value)}>{night ? 'Día' : 'Noche'}</button>
            <button className="button light" onClick={() => go('contact', 'contacto')}>Consultar</button>
          </div>
        </header>

        <div className="heroCopy">
          <div className="eyebrow">Punta del Este · Uruguay</div>
          <h1>Ocean<br /><em>Mansions.</em></h1>
          <p>Arquitectura frente al mar. Un showroom digital para recorrer el proyecto, elegir una unidad y entender cómo se vive.</p>
          <div className="heroButtons">
            <button className="button light" onClick={() => go('building', 'arquitectura')}>Explorar proyecto</button>
            <button className="button outline" onClick={() => go('floor', 'units')}>Ver unidades</button>
          </div>
        </div>

        <div className="sceneRail">
          {scenes.map((scene, index) => (
            <button
              key={scene}
              className={mode === scene ? 'active' : ''}
              onClick={() => go(scene, scene === 'floor' ? 'units' : scene === 'building' ? 'arquitectura' : scene === 'contact' ? 'contacto' : scene)}
            >
              <span>0{index + 1}</span>{sceneText[scene]}
            </button>
          ))}
          <button className="tourButton" onClick={() => setTour((value) => !value)}>
            {tour ? 'Detener recorrido' : 'Recorrido cinematográfico'}
          </button>
        </div>

        <div className="stageStats">
          <span><b>{floors.length}</b>Pisos</span>
          <span><b>{units.length}</b>Unidades</span>
          <span><b>{available}</b>Disponibles</span>
        </div>
        <UnitCard
          unit={unit}
          onClose={() => setUnit(null)}
          onInterior={() => go('interior', 'interior')}
          onContact={() => go('contact', 'contacto')}
        />
      </section>

      <section className="manifesto band">
        <div><div className="eyebrow">El proyecto</div><h2>Una propiedad<br /><em>para recorrer.</em></h2></div>
        <p>La arquitectura, la disponibilidad y la información comercial viven en el mismo recorrido. No mirás un render: entendés el proyecto y encontrás tu lugar.</p>
        <strong className="manifestoNumber">01<br /><small>Digital property experience</small></strong>
      </section>

      <section className="architecture band" id="arquitectura">
        <div className="sectionHeading">
          <div><div className="eyebrow">02 · Arquitectura</div><h2>Una torre<br /><em>frente al mar.</em></h2></div>
          <p>Doce niveles, balcones profundos y una terraza que abre la casa hacia Playa Mansa.</p>
        </div>
        <div className="architectureFacts">
          <span><b>12</b>niveles</span><span><b>48</b>unidades</span><span><b>360°</b>vista</span>
          <button className="button dark" onClick={() => go('building', 'proyecto')}>Explorar edificio ↗</button>
        </div>
      </section>

      <section className="inventory band" id="units">
        <div className="sectionHeading">
          <div><div className="eyebrow">03 · Inventario en tiempo real</div><h2>Encontrá tu<br /><em>unidad.</em></h2></div>
          <p>Filtrá el inventario y seleccioná una unidad para iluminarla en la torre y entrar a su interior.</p>
        </div>
        <div className="floorStrip">
          <span>Piso</span>
          <button className={floor === null ? 'active' : ''} onClick={() => changeFilter('floor', 'Todos')}>Todos</button>
          {floors.map((value) => <button key={value} className={floor === value ? 'active' : ''} onClick={() => changeFilter('floor', String(value))}>{String(value).padStart(2, '0')}</button>)}
        </div>
        <div className="filters">
          <select value={filters.floor} onChange={(event) => changeFilter('floor', event.target.value)}><option>Todos</option>{floors.map((value) => <option key={value}>{value}</option>)}</select>
          <select value={filters.bedrooms} onChange={(event) => changeFilter('bedrooms', event.target.value)}><option value="Todos">Dormitorios</option>{[2, 3, 4].map((value) => <option key={value} value={value}>{value} dormitorios</option>)}</select>
          <select value={filters.status} onChange={(event) => changeFilter('status', event.target.value)}><option value="Todos">Estado</option><option value="AVAILABLE">Disponible</option><option value="RESERVED">Reservado</option><option value="SOLD">Vendida</option></select>
          <span>{filtered.length} resultados</span>
        </div>
        <div className="unitGrid">
          {filtered.map((item) => (
            <button key={item.id} className={`unitTile ${unit?.id === item.id ? 'selected' : ''}`} onClick={() => selectUnit(item)}>
              <div><b>{item.number}</b><i className={`dot ${statusClass[item.status]}`} /></div>
              <span>Piso {item.floor} · {item.surface} m² · {item.bedrooms} dorm.</span>
              <strong>{money.format(item.price)}</strong>
              <small>{statusText[item.status]}</small>
            </button>
          ))}
        </div>
      </section>

      <section className="interiorBand band" id="interior">
        <div>
          <div className="eyebrow">04 · Interior</div>
          <h2>La vista<br /><em>también se habita.</em></h2>
          <p>Living, cocina integrada, materiales nobles y ventanales que convierten el horizonte en parte de la casa.</p>
          <button className="button light" onClick={() => go('interior', 'proyecto')}>{unit ? `Entrar a unidad ${unit.number}` : 'Entrar al apartamento'} ↗</button>
        </div>
        <div className="interiorDetails"><span>Living comedor</span><span>Isla de cocina</span><span>Terraza privada</span><span>Vista al mar</span></div>
      </section>

      <section className="amenities band" id="amenities">
        <div className="sectionHeading lightHeading">
          <div><div className="eyebrow">05 · Amenities</div><h2>Todo lo que<br /><em>te rodea.</em></h2></div>
          <p>Espacios para vivir el edificio como un destino, antes de volver a casa.</p>
        </div>
        <div className="amenityGrid">{(project.amenities ?? []).map((amenity, index) => <article className="amenity" key={amenity.id}><div className="amenityNumber">0{index + 1}</div><h3>{amenity.name}</h3><p>{amenity.description}</p></article>)}</div>
      </section>

      <section className="location band" id="ubicacion">
        <div className="sectionHeading"><div><div className="eyebrow">06 · Ubicación</div><h2>Playa<br /><em>Mansa.</em></h2></div><p>Una dirección tranquila frente al mar, cerca del puerto, el centro y la vida que hace de Punta del Este un destino.</p></div>
        <div className="locationGrid"><MapVisual /><div className="locationNotes"><strong>Punta del Este</strong><span>Playa Mansa · Uruguay</span><dl><div><dt>Playa Mansa</dt><dd>02 min</dd></div><div><dt>Puerto</dt><dd>08 min</dd></div><div><dt>Centro</dt><dd>10 min</dd></div></dl></div></div>
      </section>

      <section className="contact band" id="contacto">
        <div><div className="eyebrow">Tu próxima propiedad</div><h2>Conocé el proyecto<br /><em>como si ya estuvieras ahí.</em></h2><p>Dejanos tus datos y coordinamos una conversación sobre Ocean Mansions.</p></div>
        <div className="contactPanel"><ContactForm projectId={project.id} unitId={unit?.id ?? null} /></div>
      </section>
    </main>
  );
}
