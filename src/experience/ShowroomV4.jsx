import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, OrbitControls, ContactShadows, RoundedBox, Text } from '@react-three/drei';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { getProjectById } from '../platform/projectRegistry';

const project = getProjectById();
const units = project.units ?? [];
const floors = [...new Set(units.map((u) => u.floor))].sort((a, b) => a - b);
const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

function Glass({ position, size, color = '#86b8bd', opacity = .48 }) {
  return <mesh position={position} castShadow>
    <boxGeometry args={size}/><meshPhysicalMaterial color={color} roughness={.08} metalness={.22} transmission={.16} transparent opacity={opacity}/>
  </mesh>;
}

function Tree({ position, scale = 1 }) {
  return <group position={position} scale={scale}>
    <mesh position={[0, 1.5, 0]} castShadow><cylinderGeometry args={[.12, .2, 3, 7]}/><meshStandardMaterial color="#654d3d" roughness={.95}/></mesh>
    {[0, 1, 2, 3, 4].map((i) => <mesh key={i} position={[Math.cos(i * 1.256) * .55, 3.15 + (i % 2) * .35, Math.sin(i * 1.256) * .55]} castShadow><icosahedronGeometry args={[.65 + (i % 2) * .18, 1]}/><meshStandardMaterial color="#52725b" roughness={1}/></mesh>)}
  </group>;
}

function Tower({ floor, onUnit, night }) {
  const count = Math.max(7, floors.length || 7);
  return <group>
    <RoundedBox args={[21, 5, 14]} radius={.65} smoothness={5} position={[0, 2.5, 0]} castShadow receiveShadow>
      <meshStandardMaterial color="#aaa69f" roughness={.5}/>
    </RoundedBox>
    <RoundedBox args={[19.2, 1.1, 12.5]} radius={.35} position={[0, 5.35, 0]} castShadow>
      <meshStandardMaterial color="#d9d2c7" roughness={.38}/>
    </RoundedBox>
    {Array.from({ length: count }).map((_, i) => {
      const f = floors[i] ?? i + 1;
      const y = 6.35 + i * 2.42;
      const activeFloor = floor == null || floor === f;
      return <group key={f} position={[0, y, 0]}>
        <mesh castShadow><boxGeometry args={[20.2, .13, 13.4]}/><meshStandardMaterial color={activeFloor ? '#d2ccc3' : '#777875'} transparent opacity={activeFloor ? 1 : .18}/></mesh>
        <mesh position={[0, -.12, 6.72]}><boxGeometry args={[19.8, 2.05, .16]}/><meshStandardMaterial color="#9d9992" roughness={.45}/></mesh>
        {[-7.2, -3.6, 0, 3.6, 7.2].map((x, j) => {
          const u = units.find((item) => item.floor === f && Number(String(item.number).slice(-1)) === j + 1);
          const selected = u && floor === f;
          return <group key={j} position={[x, .88, 6.58]}>
            <Glass position={[0, 0, 0]} size={[3.05, 1.75, .12]} color={selected ? '#d7b36e' : night ? '#5c7780' : '#6b9ba1'} opacity={activeFloor ? .76 : .08}/>
            <mesh position={[0, -.94, .18]}><boxGeometry args={[3.12, .09, 1.05]}/><meshStandardMaterial color="#8c857b" roughness={.5}/></mesh>
            {u && <mesh position={[0, -.18, .23]} onClick={(e) => { e.stopPropagation(); onUnit(u); }}><boxGeometry args={[2.8, 1.45, .08]}/><meshStandardMaterial transparent opacity={0}/></mesh>}
            {selected && <Text position={[0, 1.18, .28]} fontSize={.22} color="#fff" outlineWidth={.025} outlineColor="#18282c">{u.number}</Text>}
          </group>;
        })}
        {[-6, 6].map((x) => <mesh key={x} position={[x, .95, 6.45]}><boxGeometry args={[.08, 1.9, .25]}/><meshStandardMaterial color="#676965" metalness={.75} roughness={.25}/></mesh>)}
      </group>;
    })}
    <RoundedBox args={[16, .38, 6.4]} radius={.22} position={[0, 5.75, 8.1]} castShadow><meshStandardMaterial color="#c7b9a5" roughness={.7}/></RoundedBox>
    <RoundedBox args={[13.8, .14, 5.5]} radius={.12} position={[0, 5.98, 8.1]}><meshStandardMaterial color="#5f9fa7" roughness={.08} metalness={.3}/></RoundedBox>
    <mesh position={[0, 8.12, 0]} castShadow><boxGeometry args={[18.2, .22, 11.2]}/><meshStandardMaterial color="#d8d1c6" roughness={.42}/></mesh>
    <mesh position={[0, 9.7, 0]}><boxGeometry args={[17.6, 2.7, 10.5]}/><meshStandardMaterial color="#b9b4ab" roughness={.38}/></mesh>
    <Glass position={[0, 10, -5.25]} size={[15.8, 2.5, .12]} opacity={.58}/>
  </group>;
}

function Site({ night }) {
  return <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -.15, 0]} receiveShadow><planeGeometry args={[180, 180]}/><meshStandardMaterial color={night ? '#111d21' : '#73847a'} roughness={1}/></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -.04, 62]}><planeGeometry args={[160, 62]}/><meshStandardMaterial color="#3e8290" roughness={.48}/></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, .01, 27]}><planeGeometry args={[15, 80]}/><meshStandardMaterial color="#d0c6b7" roughness={.8}/></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-14, .02, 27]}><planeGeometry args={[7, 80]}/><meshStandardMaterial color="#a5aa9c" roughness={1}/></mesh>
    <RoundedBox args={[18, .28, 8]} radius={.55} position={[0, .18, 15]}><meshStandardMaterial color="#d2c8b9" roughness={.7}/></RoundedBox>
    <RoundedBox args={[15.5, .16, 5.7]} radius={.42} position={[0, .37, 15]}><meshStandardMaterial color="#62aeb7" roughness={.06} metalness={.2}/></RoundedBox>
    {[-30, 30].map((x) => <group key={x}>{[-7, 12, 30, 48].map((z) => <Tree key={z} position={[x, 0, z]} scale={1 + ((z + 7) % 3) * .12}/>)}</group>)}
    {[-19, 19].map((x) => <Tree key={x} position={[x, 0, 2]} scale={1.35}/>)}
  </group>;
}

function Interior({ night }) {
  return <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[15, 12]}/><meshStandardMaterial color="#d5cec2" roughness={.58}/></mesh>
    <mesh position={[0, 3.5, -6]}><boxGeometry args={[15, 7, .15]}/><meshStandardMaterial color="#eee8df" roughness={.7}/></mesh>
    <Glass position={[0, 3.2, -5.88]} size={[13.8, 5.5, .08]} color={night ? '#263e46' : '#9fc9ca'} opacity={.68}/>
    <RoundedBox args={[5.2, .55, 2.15]} radius={.18} position={[-2, 1, .9]} castShadow><meshStandardMaterial color="#706d69" roughness={.86}/></RoundedBox>
    <RoundedBox args={[2.6, .13, 1.1]} radius={.06} position={[-2, 1.42, .9]}><meshStandardMaterial color="#b79b78" roughness={.7}/></RoundedBox>
    <RoundedBox args={[3.2, .18, 1.35]} radius={.06} position={[3, 1.05, -1.3]}><meshStandardMaterial color="#ddd3c4" roughness={.62}/></RoundedBox>
    {[2.2, 3.8].map((x) => <mesh key={x} position={[x, .55, -1.3]}><cylinderGeometry args={[.07, .07, 1, 10]}/><meshStandardMaterial color="#343b3c" metalness={.8}/></mesh>)}
    <mesh position={[5, 2.2, 2.8]}><boxGeometry args={[.12, 4.2, 5.5]}/><meshStandardMaterial color="#ded7cb" roughness={.7}/></mesh>
    <Text position={[-5.9, 5.7, -5.72]} fontSize={.22} color="#253438">OCEAN MANSIONS</Text>
    <pointLight position={[0, 3, -2]} intensity={night ? 18 : 5} color={night ? '#e6a85e' : '#e7f4f2'}/>
    <pointLight position={[-3, 2.4, 1]} intensity={night ? 8 : 2} color="#e5c28d"/>
  </group>;
}

function Scene({ mode, floor, unit, night, onUnit }) {
  const controls = useRef();
  const targets = useMemo(() => ({
    hero: [[42, 24, 48], [0, 13, 5]],
    building: [[28, 17, 31], [0, 18, 0]],
    floor: [[21, 12, 28], [0, 18, 5]],
    amenities: [[24, 9, 31], [0, 5, 11]],
    interior: [[9.5, 5.2, 10], [0, 2.5, -1.5]],
  }), []);
  useFrame(({ camera }) => {
    const [p, t] = targets[mode] || targets.hero;
    camera.position.lerp(new THREE.Vector3(...p), .035);
    if (controls.current) controls.current.target.lerp(new THREE.Vector3(...t), .05);
  });
  return <Canvas shadows dpr={[1, 1.7]} camera={{ position: [42, 24, 48], fov: 31 }} gl={{ antialias: true, powerPreference: 'high-performance' }}>
    <color attach="background" args={[night ? '#08161b' : '#a9c6c8']}/>
    <fog attach="fog" args={[night ? '#08161b' : '#a9c6c8', 48, 150]}/>
    <ambientLight intensity={night ? .28 : 1.1}/>
    <directionalLight castShadow position={[28, 42, 15]} intensity={night ? 1.15 : 4.1} color={night ? '#ffd092' : '#fff2d7'} shadow-mapSize-width={2048} shadow-mapSize-height={2048}/>
    <Environment preset="city"/>
    {mode === 'interior' ? <Interior night={night}/> : <><Site night={night}/><Tower floor={floor} onUnit={onUnit} night={night}/><ContactShadows position={[0, 0, 0]} scale={95} blur={3.5} far={75} opacity={night ? .35 : .42}/></>}
    <OrbitControls ref={controls} enableDamping dampingFactor={.06} minDistance={mode === 'interior' ? 4 : 10} maxDistance={mode === 'interior' ? 17 : 80} maxPolarAngle={Math.PI / 2.03}/>
  </Canvas>;
}

export default function ShowroomV4() {
  const [mode, setMode] = useState('hero');
  const [floor, setFloor] = useState(null);
  const [unit, setUnit] = useState(null);
  const [night, setNight] = useState(false);
  const [tour, setTour] = useState(false);
  const available = units.filter((u) => u.status === 'AVAILABLE').length;
  useEffect(() => {
    if (!tour) return undefined;
    const sequence = ['hero', 'building', 'floor', 'interior', 'amenities'];
    let i = 0;
    const id = setInterval(() => { i = (i + 1) % sequence.length; setMode(sequence[i]); }, 4300);
    return () => clearInterval(id);
  }, [tour]);
  const selectUnit = (u) => { setUnit(u); setFloor(u.floor); setMode('floor'); };
  return <main className="v4">
    <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Playfair+Display:ital,wght@0,500;0,600;1,500;1,600&display=swap');*{box-sizing:border-box}.v4{background:#0d1517;color:#f4f0e9;font-family:'DM Sans',sans-serif}.v4 button{font:inherit;color:inherit;border:0;background:none;cursor:pointer}.v4-stage{height:100vh;min-height:720px;position:relative;overflow:hidden;background:#101b1e}.v4-stage canvas{position:absolute!important;inset:0}.v4-stage:after{content:'';position:absolute;inset:0;pointer-events:none;background:linear-gradient(90deg,rgba(5,12,14,.76),transparent 54%),linear-gradient(0deg,rgba(5,10,11,.68),transparent 38%)}.v4-nav{position:absolute;z-index:5;left:0;right:0;top:0;height:92px;padding:0 5vw;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(255,255,255,.12)}.v4-brand{display:flex;align-items:center;gap:14px;letter-spacing:.08em}.v4-mark{width:38px;height:38px;border:1px solid rgba(255,255,255,.6);display:grid;place-items:center;font-size:11px}.v4-brand b{font-size:12px;font-weight:500}.v4-brand small{display:block;font-size:8px;opacity:.55;letter-spacing:.18em;margin-top:5px}.v4-nav nav{display:flex;gap:26px}.v4-nav nav button{font-size:11px;opacity:.62;letter-spacing:.12em;text-transform:uppercase}.v4-nav nav button.active,.v4-nav nav button:hover{opacity:1}.v4-actions{display:flex;gap:10px}.v4-pill{border:1px solid rgba(255,255,255,.22)!important;padding:10px 15px;font-size:10px;letter-spacing:.12em;text-transform:uppercase}.v4-pill.primary{background:#eee6d8;color:#172022;border-color:#eee6d8!important}.v4-copy{position:absolute;z-index:4;left:8vw;top:31%;max-width:610px}.v4-copy small,.v4-kicker{font-size:10px;letter-spacing:.28em;opacity:.62}.v4-copy h1{font-family:'Playfair Display',serif;font-size:clamp(62px,8.4vw,126px);line-height:.83;font-weight:500;margin:20px 0 24px;letter-spacing:-.055em}.v4-copy h1 i,.v4-section h2 i{font-weight:500}.v4-copy p{font-weight:300;font-size:15px;line-height:1.7;max-width:420px;color:rgba(244,240,233,.74)}.v4-cta{display:flex;gap:12px;margin-top:28px}.v4-cta button{padding:14px 19px;border:1px solid rgba(255,255,255,.24);font-size:10px;letter-spacing:.14em;text-transform:uppercase}.v4-cta .main{background:#eee6d8;color:#172022;border-color:#eee6d8}.v4-meta{position:absolute;z-index:4;bottom:42px;left:5vw;display:flex;gap:38px;font-size:10px;letter-spacing:.1em;text-transform:uppercase;opacity:.72}.v4-meta b{font-size:18px;display:block;font-weight:400;margin-bottom:5px;opacity:1}.v4-side{position:absolute;z-index:4;right:5vw;bottom:42px;display:flex;flex-direction:column;gap:7px;align-items:flex-end}.v4-side small{font-size:8px;letter-spacing:.18em;opacity:.5}.v4-floors{display:flex;gap:6px}.v4-floors button{width:32px;height:32px;border:1px solid rgba(255,255,255,.16);font-size:9px}.v4-floors button.on,.v4-floors button:hover{background:#eee6d8;color:#172022}.v4-card{position:absolute;z-index:6;right:5vw;top:24%;width:285px;padding:23px;background:rgba(13,21,23,.86);backdrop-filter:blur(18px);border:1px solid rgba(255,255,255,.14)}.v4-card small{font-size:8px;letter-spacing:.16em;opacity:.55}.v4-card h2{font-family:'Playfair Display',serif;font-size:27px;font-weight:500;margin:12px 0 4px}.v4-card strong{font-size:19px;font-weight:400}.v4-card .metrics{display:flex;gap:12px;border-top:1px solid rgba(255,255,255,.12);border-bottom:1px solid rgba(255,255,255,.12);padding:14px 0;margin:16px 0;font-size:10px;opacity:.72}.v4-card .enter{width:100%;padding:13px;background:#eee6d8;color:#172022;font-size:9px;letter-spacing:.12em;text-transform:uppercase}.v4-card .close{position:absolute;right:13px;top:10px;font-size:20px;opacity:.6}.v4-section{padding:120px 8vw;background:#f0ebe3;color:#1c292b;display:grid;grid-template-columns:1fr 1fr;gap:9vw}.v4-section h2{font-family:'Playfair Display',serif;font-weight:500;font-size:clamp(48px,6vw,88px);line-height:.9;margin:18px 0}.v4-section p{font-weight:300;line-height:1.8;color:#657073;max-width:520px;margin-top:34px}.v4-inventory{padding:115px 8vw;background:#f0ebe3;color:#1c292b}.v4-title{display:flex;justify-content:space-between;align-items:end;margin-bottom:40px}.v4-title h2{font-family:'Playfair Display',serif;font-size:64px;font-weight:500;line-height:.9;margin:14px 0 0}.v4-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:#c9c2b7;border:1px solid #c9c2b7}.v4-unit{background:#f0ebe3;text-align:left;padding:24px;min-height:170px}.v4-unit header{display:flex;justify-content:space-between}.v4-unit b{font-size:17px;font-weight:400}.v4-unit .dot{width:7px;height:7px;border-radius:50%;background:#718a78;margin-top:5px}.v4-unit span,.v4-unit small{display:block;font-size:9px;letter-spacing:.08em;text-transform:uppercase;color:#7c8382}.v4-unit span{margin-top:35px}.v4-unit strong{display:block;font-size:18px;font-weight:400;margin-top:10px}.v4-dark{background:#101a1c;color:#f0ebe3;padding:120px 8vw;display:grid;grid-template-columns:1fr 2fr;gap:8vw}.v4-dark h2{font-family:'Playfair Display',serif;font-weight:500;font-size:65px;line-height:.9;margin-top:18px}.v4-amenities{display:grid;grid-template-columns:1fr 1fr;gap:1px;background:#354144}.v4-amenities article{background:#101a1c;padding:34px;min-height:210px}.v4-amenities h3{font-family:'Playfair Display',serif;font-size:28px;font-weight:500;margin:38px 0 10px}.v4-amenities p{font-size:11px;line-height:1.6;opacity:.55}.v4-amenities span{font-size:9px;letter-spacing:.13em;text-transform:uppercase;display:block;margin-top:22px;opacity:.7}@media(max-width:900px){.v4-nav nav{display:none}.v4-copy{left:7vw;top:25%}.v4-meta{gap:16px}.v4-grid{grid-template-columns:1fr 1fr}.v4-section,.v4-dark{grid-template-columns:1fr;padding:80px 7vw}.v4-amenities{grid-template-columns:1fr}.v4-side{display:none}}`}</style>
    <section className="v4-stage">
      <div className="v4-nav"><div className="v4-brand"><div className="v4-mark">OM</div><div><b>OCEAN MANSIONS</b><small>PUNTA DEL ESTE · DIGITAL SHOWROOM</small></div></div><nav><button className={mode === 'hero' ? 'active' : ''} onClick={() => setMode('hero')}>Proyecto</button><button className={mode === 'building' ? 'active' : ''} onClick={() => setMode('building')}>Arquitectura</button><button className={mode === 'floor' ? 'active' : ''} onClick={() => setMode('floor')}>Unidades</button><button className={mode === 'amenities' ? 'active' : ''} onClick={() => setMode('amenities')}>Lifestyle</button></nav><div className="v4-actions"><button className="v4-pill" onClick={() => setNight((v) => !v)}>{night ? 'Día' : 'Noche'}</button><button className="v4-pill primary" onClick={() => setTour((v) => !v)}>{tour ? 'Pausar' : 'Tour'}</button></div></div>
      <Scene mode={mode} floor={floor} unit={unit} night={night} onUnit={selectUnit}/>
      <div className="v4-copy"><small>PLAYA MANSA · PUNTA DEL ESTE · URUGUAY</small><h1>Ocean<br/><i>Mansions</i></h1><p>Una nueva forma de presentar arquitectura, inventario y experiencia. Explorá el proyecto como si ya estuvieras ahí.</p><div className="v4-cta"><button className="main" onClick={() => setMode('building')}>Explorar proyecto ↗</button><button onClick={() => setMode('interior')}>Entrar al interior</button></div></div>
      <div className="v4-meta"><span><b>{units.length}</b>Unidades</span><span><b>{available}</b>Disponibles</span><span><b>{floors.length || 7}</b>Niveles</span><span><b>245K</b>Desde USD</span></div>
      <div className="v4-side"><small>Navegación por piso</small><div className="v4-floors">{floors.map((f) => <button key={f} className={floor === f ? 'on' : ''} onClick={() => { setFloor(f); setMode('floor'); }}>{String(f).padStart(2, '0')}</button>)}</div></div>
      {unit && <aside className="v4-card"><button className="close" onClick={() => setUnit(null)}>×</button><small>UNIDAD {unit.number} · PISO {unit.floor}</small><h2>{unit.type}</h2><strong>{money.format(unit.price)}</strong><div className="metrics"><span>{unit.area ?? unit.surface} m²</span><span>{unit.bedrooms} dorm.</span><span>{unit.bathrooms} baños</span></div><button className="enter" onClick={() => setMode('interior')}>Entrar a la unidad ↗</button></aside>}
    </section>
    <section className="v4-section"><div><small className="v4-kicker">01 · EXPERIENCIA</small><h2>El proyecto<br/>se <i>recorre.</i></h2></div><p>Del masterplan a la unidad en segundos. El showroom convierte una presentación inmobiliaria tradicional en una experiencia digital interactiva: arquitectura, disponibilidad, planos, interiores y amenities conviven en un mismo recorrido.</p></section>
    <section className="v4-inventory"><div className="v4-title"><div><small className="v4-kicker">02 · APARTMENT FINDER</small><h2>Encontrá tu unidad.</h2></div><button className="v4-pill" style={{color:'#1c292b',borderColor:'#bbb4aa'}} onClick={() => setMode('floor')}>Ver edificio ↗</button></div><div className="v4-grid">{units.slice(0, 16).map((u) => <button className="v4-unit" key={u.id} onClick={() => selectUnit(u)}><header><b>{u.number}</b><i className="dot"/></header><span>{u.type} · piso {u.floor}</span><strong>{money.format(u.price)}</strong><small>{u.area ?? u.surface} m² · {u.bedrooms} dormitorios</small></button>)}</div></section>
    <section className="v4-dark"><div><small className="v4-kicker">03 · LIFESTYLE</small><h2>Amenidades<br/><i>para vivir.</i></h2></div><div className="v4-amenities">{(project.amenities ?? []).map((a, i) => <article key={a.id} onClick={() => setMode('amenities')}><small>0{i + 1}</small><h3>{a.name}</h3><p>{a.description}</p><span>Explorar experiencia ↗</span></article>)}</div></section>
  </main>;
}
