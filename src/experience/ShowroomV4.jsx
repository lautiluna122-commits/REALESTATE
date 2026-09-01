import { Canvas, useFrame } from '@react-three/fiber';
import { ContactShadows, Environment, OrbitControls, RoundedBox, Text } from '@react-three/drei';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { getProjectById } from '../platform/projectRegistry';

const project = getProjectById();
const units = project.units ?? [];
const floors = [...new Set(units.map((u) => u.floor))].sort((a, b) => a - b);
const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

const glass = '#7faeb5';
const stone = '#d7d0c5';
const dark = '#243337';

function Window({ position, size = [2.8, 1.65, .1], active = false, night = false }) {
  return <group position={position}>
    <mesh castShadow><boxGeometry args={size}/><meshPhysicalMaterial color={active ? '#e4c27c' : glass} roughness={.05} metalness={.25} transmission={.22} transparent opacity={night && !active ? .72 : .84}/></mesh>
    <mesh position={[0, 0, .08]}><boxGeometry args={[size[0] + .12, .08, .12]}/><meshStandardMaterial color="#343b3c" metalness={.75} roughness={.25}/></mesh>
  </group>;
}

function Palm({ position, scale = 1 }) {
  return <group position={position} scale={scale}>
    <mesh position={[0, 1.9, 0]} rotation={[0, 0, -.05]} castShadow><cylinderGeometry args={[.11, .19, 3.8, 9]}/><meshStandardMaterial color="#725943" roughness={.9}/></mesh>
    {Array.from({ length: 8 }).map((_, i) => <mesh key={i} position={[0, 3.85, 0]} rotation={[.35, i * Math.PI / 4, -.42]} castShadow><boxGeometry args={[.16, 2.3, .08]}/><meshStandardMaterial color="#3f6955" roughness={.92}/></mesh>)}
  </group>;
}

function Shrub({ position, scale = 1 }) {
  return <group position={position} scale={scale}>{[[-.35, .25, 0], [0, .35, .12], [.38, .24, -.04]].map((p, i) => <mesh key={i} position={p} castShadow><icosahedronGeometry args={[.42 + i * .04, 1]}/><meshStandardMaterial color="#456956" roughness={1}/></mesh>)}</group>;
}

function Pool({ position = [0, .28, 18] }) {
  return <group position={position}>
    <RoundedBox args={[25, .38, 10]} radius={.55} position={[0, 0, 0]} receiveShadow><meshStandardMaterial color="#b9ad9c" roughness={.72}/></RoundedBox>
    <RoundedBox args={[23.4, .18, 8.4]} radius={.42} position={[0, .25, 0]}><meshPhysicalMaterial color="#62aeb9" roughness={.06} metalness={.18} transmission={.12}/></RoundedBox>
    <mesh position={[0, .39, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[21, 6.8]}/><meshStandardMaterial color="#77c1c5" roughness={.08} metalness={.12}/></mesh>
  </group>;
}

function Tower({ floor, onUnit, night }) {
  const count = Math.max(7, floors.length || 7);
  const floorHeight = 2.55;
  return <group>
    <RoundedBox args={[22, 5.5, 14.5]} radius={.7} smoothness={6} position={[0, 2.75, 0]} castShadow receiveShadow><meshStandardMaterial color="#8e8d88" roughness={.55}/></RoundedBox>
    <RoundedBox args={[20.5, .85, 13.2]} radius={.28} position={[0, 5.85, 0]} castShadow><meshStandardMaterial color="#e1dbd1" roughness={.34}/></RoundedBox>
    {Array.from({ length: count }).map((_, i) => {
      const f = floors[i] ?? i + 1;
      const y = 7 + i * floorHeight;
      const active = floor == null || floor === f;
      return <group key={f} position={[0, y, 0]}>
        <mesh position={[0, 0, 0]} castShadow><boxGeometry args={[21.1, .13, 13.8]}/><meshStandardMaterial color={active ? stone : '#696c6a'} transparent opacity={active ? 1 : .18}/></mesh>
        <mesh position={[0, -.22, 6.95]}><boxGeometry args={[20.5, 2.2, .16]}/><meshStandardMaterial color="#8e8b84" roughness={.42}/></mesh>
        {[-7.5, -3.75, 0, 3.75, 7.5].map((x, j) => {
          const u = units.find((item) => item.floor === f && Number(String(item.number).slice(-1)) === j + 1);
          const selected = Boolean(u && floor === f);
          return <group key={j} position={[x, .86, 6.83]}>
            <Window active={selected} night={night} />
            <mesh position={[0, -.96, .2]}><boxGeometry args={[3.15, .1, 1.15]}/><meshStandardMaterial color="#8a8379" roughness={.48}/></mesh>
            {u && <mesh position={[0, 0, .22]} onClick={(e) => { e.stopPropagation(); onUnit(u); }}><boxGeometry args={[3.1, 1.55, .12]}/><meshStandardMaterial transparent opacity={0}/></mesh>}
            {selected && <Text position={[0, 1.22, .3]} fontSize={.24} color="#f7ead2" outlineWidth={.03} outlineColor="#182527">{u.number}</Text>}
          </group>;
        })}
        {[-9.5, 9.5].map((x) => <mesh key={x} position={[x, .9, 6.58]}><boxGeometry args={[.1, 2, .3]}/><meshStandardMaterial color="#515655" metalness={.8} roughness={.2}/></mesh>)}
      </group>;
    })}
    <RoundedBox args={[17.2, .45, 6.8]} radius={.25} position={[0, 6.2, 8.45]} castShadow><meshStandardMaterial color="#c6b7a2" roughness={.68}/></RoundedBox>
    <RoundedBox args={[15, .14, 5.8]} radius={.14} position={[0, 6.47, 8.45]}><meshStandardMaterial color="#5e9fa7" roughness={.07} metalness={.25}/></RoundedBox>
    <mesh position={[0, 8.62, 0]} castShadow><boxGeometry args={[18.8, .25, 11.5]}/><meshStandardMaterial color="#ddd5ca" roughness={.4}/></mesh>
    <RoundedBox args={[17.8, 2.8, 10.8]} radius={.25} position={[0, 10.15, 0]} castShadow><meshStandardMaterial color="#aaa8a2" roughness={.32}/></RoundedBox>
    <Window position={[0, 10.15, -5.48]} size={[16.4, 2.5, .12]} night={night}/>
    <Text position={[0, 11.65, -5.62]} fontSize={.42} color="#eee7db" letterSpacing={.08}>OCEAN MANSIONS</Text>
  </group>;
}

function Site({ night }) {
  return <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -.15, 0]} receiveShadow><planeGeometry args={[220, 220]}/><meshStandardMaterial color={night ? '#101b1d' : '#78867d'} roughness={1}/></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -.05, 72]}><planeGeometry args={[190, 72]}/><meshStandardMaterial color="#3b7e8b" roughness={.5}/></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, .01, 35]}><planeGeometry args={[18, 92]}/><meshStandardMaterial color="#d3c7b8" roughness={.82}/></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-12, .02, 35]}><planeGeometry args={[6, 92]}/><meshStandardMaterial color="#9fa69b" roughness={1}/></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[12, .02, 35]}><planeGeometry args={[6, 92]}/><meshStandardMaterial color="#9fa69b" roughness={1}/></mesh>
    <Pool/>
    {[-29, -22, 22, 29].map((x) => <Palm key={x} position={[x, 0, 4 + Math.abs(x) % 9]} scale={1.05}/>) }
    {[-18, 18].map((x) => <Palm key={x} position={[x, 0, 28]} scale={.9}/>) }
    {[-14, -9, 9, 14].map((x) => <Shrub key={x} position={[x, .1, 7]} scale={1.05}/>) }
    {[-25, 25].map((x) => <Shrub key={x} position={[x, .1, 17]}/>) }
    <RoundedBox args={[20, .24, 8]} radius={.55} position={[0, .2, -1]} castShadow><meshStandardMaterial color="#d6ccbc" roughness={.72}/></RoundedBox>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, .33, -1]}><planeGeometry args={[17.5, 5.8]}/><meshStandardMaterial color="#6b8f82" roughness={.82}/></mesh>
  </group>;
}

function Interior({ night }) {
  return <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[16, 13]}/><meshStandardMaterial color="#d9d1c5" roughness={.52}/></mesh>
    <mesh position={[0, 3.7, -6.5]}><boxGeometry args={[16, 7.4, .15]}/><meshStandardMaterial color="#f0ebe3" roughness={.72}/></mesh>
    <Window position={[0, 3.25, -6.38]} size={[14.6, 5.8, .1]} night={night}/>
    <RoundedBox args={[5.5, .6, 2.35]} radius={.2} position={[-2.1, 1.05, .8]} castShadow><meshStandardMaterial color="#686967" roughness={.84}/></RoundedBox>
    <RoundedBox args={[5.1, .16, 2]} radius={.1} position={[-2.1, 1.4, .8]}><meshStandardMaterial color="#b99b76" roughness={.68}/></RoundedBox>
    <RoundedBox args={[3.4, .18, 1.5]} radius={.08} position={[3, 1.1, -1.35]} castShadow><meshStandardMaterial color="#ded5c8" roughness={.6}/></RoundedBox>
    {[2.2, 3.8].map((x) => <mesh key={x} position={[x, .55, -1.35]}><cylinderGeometry args={[.07, .07, 1, 12]}/><meshStandardMaterial color="#313a3b" metalness={.8} roughness={.22}/></mesh>)}
    <RoundedBox args={[2.6, .22, 1.15]} radius={.08} position={[4.6, 1.05, 2.55]}><meshStandardMaterial color="#b59a7a" roughness={.68}/></RoundedBox>
    <mesh position={[4.6, 2.05, 2.55]}><boxGeometry args={[.07, 1.9, .07]}/><meshStandardMaterial color="#4a5050" metalness={.8}/></mesh>
    <Text position={[-6.2, 6.25, -6.2]} fontSize={.28} color="#26373a" letterSpacing={.08}>OCEAN MANSIONS</Text>
    <pointLight position={[0, 3.4, -2]} intensity={night ? 24 : 4} color={night ? '#ffc56f' : '#fff8ea'}/>
    <pointLight position={[4, 2.2, 1]} intensity={night ? 10 : 2} color="#e9c994"/>
  </group>;
}

function Scene({ mode, floor, night, onUnit }) {
  const controls = useRef();
  const targets = useMemo(() => ({
    hero: [[48, 28, 55], [0, 15, 8]],
    building: [[31, 20, 36], [0, 18, 2]],
    floor: [[24, 14, 31], [0, 18, 6]],
    amenities: [[30, 12, 34], [0, 5, 15]],
    interior: [[10.5, 6, 12], [0, 2.8, -1]],
  }), []);
  useFrame(({ camera }) => {
    const [p, t] = targets[mode] || targets.hero;
    camera.position.lerp(new THREE.Vector3(...p), .045);
    if (controls.current) controls.current.target.lerp(new THREE.Vector3(...t), .06);
  });
  return <Canvas shadows dpr={[1, 1.8]} camera={{ position: [48, 28, 55], fov: 30 }} gl={{ antialias: true, powerPreference: 'high-performance' }}>
    <color attach="background" args={[night ? '#071318' : '#a9c9cc']}/>
    <fog attach="fog" args={[night ? '#071318' : '#a9c9cc', 55, 165]}/>
    <ambientLight intensity={night ? .22 : 1.05}/>
    <directionalLight castShadow position={night ? [-18, 32, 8] : [34, 45, 20]} intensity={night ? 1.7 : 4.5} color={night ? '#ffd49b' : '#fff1d5'} shadow-mapSize-width={2048} shadow-mapSize-height={2048}/>
    <Environment preset={night ? 'night' : 'city'} background={false}/>
    {mode === 'interior' ? <Interior night={night}/> : <><Site night={night}/><Tower floor={floor} onUnit={onUnit} night={night}/><ContactShadows position={[0, 0, 0]} scale={105} blur={3.5} far={85} opacity={night ? .42 : .46}/></>}
    <OrbitControls ref={controls} enableDamping dampingFactor={.055} minDistance={mode === 'interior' ? 4 : 12} maxDistance={mode === 'interior' ? 18 : 90} maxPolarAngle={Math.PI / 2.04}/>
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
  const reset = () => { setMode('hero'); setFloor(null); setUnit(null); setTour(false); };

  return <main className="v4">
    <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Playfair+Display:ital,wght@0,500;0,600;1,500;1,600&display=swap');*{box-sizing:border-box}.v4{background:#0b1214;color:#f5f0e8;font-family:'DM Sans',sans-serif}.v4 button{font:inherit;color:inherit;border:0;background:none;cursor:pointer}.stage{height:100vh;min-height:720px;position:relative;overflow:hidden;background:#101b1d}.stage canvas{position:absolute!important;inset:0}.stage:after{content:'';position:absolute;inset:0;pointer-events:none;background:linear-gradient(90deg,rgba(3,9,11,.78),transparent 58%),linear-gradient(0deg,rgba(4,8,9,.74),transparent 42%)}.nav{position:absolute;z-index:8;left:0;right:0;top:0;height:88px;padding:0 5vw;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(255,255,255,.13);backdrop-filter:blur(10px)}.brand{display:flex;gap:13px;align-items:center}.mark{width:38px;height:38px;border:1px solid rgba(255,255,255,.6);display:grid;place-items:center;font-size:10px;letter-spacing:.1em}.brand b{font-size:12px;font-weight:500;letter-spacing:.18em}.brand small{display:block;font-size:8px;opacity:.5;letter-spacing:.2em;margin-top:5px}.navlinks{display:flex;gap:25px}.navlinks button{font-size:10px;letter-spacing:.15em;text-transform:uppercase;opacity:.6}.navlinks button:hover,.navlinks button.active{opacity:1}.actions{display:flex;gap:9px}.pill{border:1px solid rgba(255,255,255,.24)!important;padding:10px 14px;font-size:9px;letter-spacing:.14em;text-transform:uppercase}.pill.primary{background:#eee6d7;color:#152022;border-color:#eee6d7!important}.heroCopy{position:absolute;z-index:6;left:5vw;top:25vh;max-width:590px}.eyebrow{font-size:10px;letter-spacing:.28em;text-transform:uppercase;opacity:.62;margin-bottom:20px}.heroCopy h1{font-family:'Playfair Display',serif;font-weight:500;font-size:clamp(48px,6.3vw,96px);line-height:.93;letter-spacing:-.04em;margin:0 0 24px}.heroCopy h1 em{font-weight:500}.heroCopy p{max-width:450px;font-size:15px;line-height:1.7;color:rgba(245,240,232,.72);margin:0}.heroButtons{display:flex;gap:10px;margin-top:30px}.heroButtons button{padding:13px 18px;border:1px solid rgba(255,255,255,.3);font-size:9px;letter-spacing:.15em;text-transform:uppercase}.heroButtons .solid{background:#eee6d7;color:#152022;border-color:#eee6d7}.stats{position:absolute;z-index:6;left:5vw;bottom:35px;display:flex;gap:34px}.stat{border-left:1px solid rgba(255,255,255,.24);padding-left:13px}.stat strong{font-family:'Playfair Display',serif;font-size:24px;font-weight:500}.stat span{display:block;font-size:8px;letter-spacing:.16em;text-transform:uppercase;opacity:.52;margin-top:4px}.side{position:absolute;z-index:7;right:3vw;top:118px;width:220px;display:flex;flex-direction:column;gap:8px}.side button{background:rgba(12,20,22,.68);border:1px solid rgba(255,255,255,.13);padding:11px 12px;text-align:left;font-size:9px;letter-spacing:.12em;text-transform:uppercase;backdrop-filter:blur(12px)}.side button.active{border-color:rgba(235,211,164,.65);background:rgba(235,211,164,.12)}.side .tour{margin-top:8px;text-align:center;background:#eee6d7;color:#172123;border-color:#eee6d7}.unitCard{position:absolute;z-index:9;right:3vw;bottom:35px;width:320px;padding:20px;background:rgba(10,17,19,.88);border:1px solid rgba(255,255,255,.18);backdrop-filter:blur(18px);box-shadow:0 20px 60px rgba(0,0,0,.3)}.unitCard .top{display:flex;justify-content:space-between;align-items:start}.unitCard h3{font-family:'Playfair Display',serif;font-size:29px;font-weight:500;margin:4px 0}.unitCard .close{font-size:20px;opacity:.6}.badge{font-size:8px;letter-spacing:.14em;text-transform:uppercase;color:#d9c28d}.unitMeta{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:17px 0;border-top:1px solid rgba(255,255,255,.1);border-bottom:1px solid rgba(255,255,255,.1);padding:13px 0}.unitMeta span{font-size:8px;opacity:.45;text-transform:uppercase;letter-spacing:.1em}.unitMeta b{display:block;font-size:13px;margin-top:4px;font-weight:400}.price{font-family:'Playfair Display',serif;font-size:27px}.finder{padding:46px 5vw 70px;background:#f1ece4;color:#172224}.finderHead{display:flex;justify-content:space-between;align-items:end;margin-bottom:28px}.finder h2{font-family:'Playfair Display',serif;font-size:48px;font-weight:500;margin:0}.finder p{font-size:12px;opacity:.6}.unitGrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:10px}.unitBtn{padding:18px;background:#fff;border:1px solid #d7d0c5;text-align:left;color:#172224}.unitBtn:hover,.unitBtn.selected{border-color:#9f8558;box-shadow:inset 0 0 0 1px #9f8558}.unitBtn b{font-family:'Playfair Display',serif;font-size:24px;font-weight:500}.unitBtn small{display:block;margin-top:8px;opacity:.55}.unitBtn strong{display:block;margin-top:14px;font-size:13px;font-weight:500}.amenities{padding:70px 5vw;background:#10191b}.amenities h2{font-family:'Playfair Display',serif;font-size:52px;font-weight:500;margin:0 0 35px}.amenityGrid{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:rgba(255,255,255,.12)}.amenity{min-height:220px;padding:24px;background:#10191b;border-top:1px solid rgba(255,255,255,.08)}.amenity .num{font-size:9px;letter-spacing:.2em;opacity:.45}.amenity h3{font-family:'Playfair Display',serif;font-size:28px;font-weight:500;margin:65px 0 10px}.amenity p{font-size:11px;line-height:1.6;opacity:.52}.footer{padding:80px 5vw;background:#eee8df;color:#162225;display:flex;justify-content:space-between;align-items:end}.footer h2{font-family:'Playfair Display',serif;font-size:58px;font-weight:500;max-width:600px;margin:0}.footer button{padding:14px 19px;background:#162225;color:#eee8df;font-size:9px;letter-spacing:.15em;text-transform:uppercase}@media(max-width:900px){.navlinks{display:none}.side{width:170px}.heroCopy{top:22vh}.amenityGrid{grid-template-columns:1fr 1fr}.footer{display:block}.footer button{margin-top:30px}}@media(max-width:620px){.stage{min-height:680px}.nav{padding:0 20px}.actions .pill:first-child{display:none}.heroCopy{left:20px;right:20px;top:23vh}.heroCopy h1{font-size:54px}.side{right:20px;top:auto;bottom:105px;width:150px}.stats{left:20px;bottom:25px;gap:15px}.stat strong{font-size:18px}.unitCard{left:20px;right:20px;width:auto}.finder,.amenities,.footer{padding-left:20px;padding-right:20px}.finder h2,.amenities h2,.footer h2{font-size:39px}.amenityGrid{grid-template-columns:1fr}.unitGrid{grid-template-columns:1fr 1fr}}`}</style>
    <section className="stage">
      <Scene mode={mode} floor={floor} night={night} onUnit={selectUnit}/>
      <header className="nav">
        <button className="brand" onClick={reset}><span className="mark">OM</span><span><b>OCEAN MANSIONS</b><small>PUNTA DEL ESTE · PLAYA MANSA</small></span></button>
        <nav className="navlinks">{[['hero','Proyecto'],['building','Arquitectura'],['floor','Unidades'],['amenities','Amenities']].map(([id,label]) => <button key={id} className={mode===id?'active':''} onClick={() => setMode(id)}>{label}</button>)}</nav>
        <div className="actions"><button className="pill" onClick={() => setNight((v) => !v)}>{night ? 'Día' : 'Noche'}</button><button className="pill primary" onClick={() => document.getElementById('finder')?.scrollIntoView({ behavior:'smooth' })}>Ver unidades</button></div>
      </header>
      <div className="heroCopy">
        <div className="eyebrow">Punta del Este · Uruguay</div>
        <h1>Arquitectura frente al <em>mar.</em></h1>
        <p>Un showroom digital pensado para vender el proyecto antes de la primera visita: arquitectura, unidades, interiores y amenities en una sola experiencia.</p>
        <div className="heroButtons"><button className="solid" onClick={() => setMode('building')}>Explorar proyecto</button><button onClick={() => setMode('interior')}>Entrar a un apartamento</button></div>
      </div>
      <div className="side">
        <button className={mode==='hero'?'active':''} onClick={() => setMode('hero')}>01 · Masterplan</button>
        <button className={mode==='building'?'active':''} onClick={() => setMode('building')}>02 · Edificio</button>
        <button className={mode==='floor'?'active':''} onClick={() => setMode('floor')}>03 · Pisos y vistas</button>
        <button className={mode==='interior'?'active':''} onClick={() => setMode('interior')}>04 · Interior</button>
        <button className={mode==='amenities'?'active':''} onClick={() => setMode('amenities')}>05 · Amenities</button>
        <button className="tour" onClick={() => setTour((v) => !v)}>{tour ? 'Detener recorrido' : '▶ Recorrido cinematográfico'}</button>
      </div>
      <div className="stats"><div className="stat"><strong>{floors.length || 7}</strong><span>Pisos</span></div><div className="stat"><strong>{units.length || 35}</strong><span>Unidades</span></div><div className="stat"><strong>{available}</strong><span>Disponibles</span></div></div>
      {unit && <article className="unitCard"><div className="top"><div><div className="badge">Disponible · Piso {unit.floor}</div><h3>Unidad {unit.number}</h3></div><button className="close" onClick={() => setUnit(null)}>×</button></div><div className="unitMeta"><div><span>Superficie</span><b>{unit.surface} m²</b></div><div><span>Dormitorios</span><b>{unit.bedrooms}</b></div><div><span>Baños</span><b>{unit.bathrooms}</b></div></div><div className="price">{money.format(unit.price)}</div><button className="pill primary" style={{width:'100%',marginTop:14}} onClick={() => setMode('interior')}>Ver apartamento</button></article>}
    </section>
    <section id="finder" className="finder"><div className="finderHead"><div><div className="eyebrow">Disponibilidad</div><h2>Encontrá tu unidad.</h2></div><p>{available} unidades disponibles · actualización en tiempo real</p></div><div className="unitGrid">{units.slice(0, 18).map((u) => <button key={u.id} className={`unitBtn ${unit?.id===u.id?'selected':''}`} onClick={() => selectUnit(u)}><b>{u.number}</b><small>Piso {u.floor} · {u.surface} m² · {u.bedrooms} dorm.</small><strong>{money.format(u.price)}</strong></button>)}</div></section>
    <section className="amenities"><div className="eyebrow">El proyecto</div><h2>Una forma distinta de vivir.</h2><div className="amenityGrid">{(project.amenities ?? []).map((a, i) => <article className="amenity" key={a.id}><div className="num">0{i+1}</div><h3>{a.name}</h3><p>{a.description}</p></article>)}</div></section>
    <footer className="footer"><div><div className="eyebrow">Ocean Mansions · Punta del Este</div><h2>Conocé el proyecto como si ya estuvieras ahí.</h2></div><button onClick={() => window.location.href='mailto:ventas@oceanmansions.uy'}>Solicitar información</button></footer>
  </main>;
}
