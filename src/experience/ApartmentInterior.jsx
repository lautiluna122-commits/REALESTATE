import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, OrbitControls, useGLTF, useTexture } from '@react-three/drei';
import { Suspense, useMemo, useRef, useState } from 'react';
import { Vector3 } from 'three';
import { getProjectBySlug, getProjectUnits } from '../platform/projectRegistry';
import { getShowroomEngine, resolveShowroomAsset } from './showroomEngine';
import './apartment-interior.css';

const ROOMS = [
  { id: 'living', label: 'Living', position: [0, 2.4, 11], target: [0, 1.6, 5] },
  { id: 'kitchen', label: 'Cocina', position: [10, 2.8, 3], target: [4, 1.5, 0] },
  { id: 'suite', label: 'Suite', position: [-10, 2.8, -4], target: [-4, 1.5, -4] },
  { id: 'bathroom', label: 'Baño', position: [9, 2.5, -8], target: [4, 1.5, -7] },
  { id: 'terrace', label: 'Terraza', position: [0, 3.8, -15], target: [0, 2, -9] },
];

function SafeGLTF({ src }) {
  if (!src) return null;
  const { scene } = useGLTF(src);
  return <primitive object={scene} dispose={null} />;
}

function Panorama({ src }) {
  const texture = useTexture(src);
  return <mesh scale={[-1, 1, 1]}><sphereGeometry args={[40, 64, 40]} /><meshBasicMaterial map={texture} toneMapped={false} /></mesh>;
}

function Camera({ room }) {
  const controls = useRef();
  const targets = useMemo(() => Object.fromEntries(ROOMS.map((item) => [item.id, { position: new Vector3(...item.position), target: new Vector3(...item.target) }])), []);
  useFrame(({ camera }) => {
    const next = targets[room] ?? targets.living;
    camera.position.lerp(next.position, 0.055);
    controls.current?.target.lerp(next.target, 0.065);
  });
  return <OrbitControls ref={controls} makeDefault enableDamping dampingFactor={0.08} minDistance={2.8} maxDistance={24} maxPolarAngle={Math.PI / 1.98} />;
}

function FallbackInterior({ night }) {
  return <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[28, 26]} /><meshStandardMaterial color="#c9c0b2" roughness={0.8} /></mesh>
    <mesh position={[0, 4.5, -8]}><boxGeometry args={[28, 9, 0.25]} /><meshStandardMaterial color="#eee9df" roughness={0.82} /></mesh>
    <mesh position={[-13.8, 4, 0]}><boxGeometry args={[0.25, 8, 20]} /><meshStandardMaterial color="#eee9df" roughness={0.82} /></mesh>
    <mesh position={[13.8, 4, 0]}><boxGeometry args={[0.25, 8, 20]} /><meshStandardMaterial color="#eee9df" roughness={0.82} /></mesh>
    <mesh position={[0, 4, -7.82]}><boxGeometry args={[18, 6.5, 0.08]} /><meshStandardMaterial color={night ? '#6e604d' : '#789aa1'} roughness={0.08} metalness={0.5} emissive={night ? '#5b3c1c' : '#163c44'} emissiveIntensity={night ? 0.55 : 0.04} /></mesh>
    <mesh position={[0, 0.65, 3]}><boxGeometry args={[8, 1.1, 2.8]} /><meshStandardMaterial color="#a59a8c" roughness={0.8} /></mesh>
    <mesh position={[4.5, 1.1, 0]}><boxGeometry args={[5, 0.12, 1.2]} /><meshStandardMaterial color="#b9a58a" roughness={0.3} metalness={0.25} /></mesh>
    <mesh position={[-4, 0.8, -4]}><boxGeometry args={[4.6, 0.55, 5.8]} /><meshStandardMaterial color="#e1dbd1" roughness={0.72} /></mesh>
  </group>;
}

function Scene({ assets, room, night }) {
  const model = assets?.unitModel?.path ?? assets?.interiorModel?.path;
  const panorama = assets?.panorama360?.path;
  return <Canvas shadows camera={{ position: [0, 2.5, 11], fov: 58 }} dpr={[1, 1.7]} gl={{ antialias: true, powerPreference: 'high-performance' }}>
    <color attach="background" args={[night ? '#16120f' : '#d8d0c4']} />
    <ambientLight intensity={night ? 0.45 : 1.25} />
    <directionalLight castShadow position={[-4, 9, 5]} intensity={night ? 1.05 : 2.1} color={night ? '#f0b86c' : '#fff1d4'} />
    <pointLight position={[0, 4, 2]} intensity={night ? 1.5 : 0.45} color="#ffe3b1" />
    <Environment preset="apartment" />
    {panorama ? <Suspense fallback={null}><Panorama src={panorama} /></Suspense> : <FallbackInterior night={night} />}
    {model && <Suspense fallback={null}><SafeGLTF src={model} /></Suspense>}
    <Camera room={room} />
  </Canvas>;
}

function getSlug() {
  return window.location.pathname.match(/^\/proyecto\/([^/]+)\/interior/)?.[1] ?? 'ocean-mansions';
}

export default function ApartmentInterior() {
  const slug = getSlug();
  const project = getProjectBySlug(slug);
  const units = getProjectUnits(project);
  const engine = getShowroomEngine(project);
  const [unitId, setUnitId] = useState(units[0]?.id ?? null);
  const [room, setRoom] = useState('living');
  const [night, setNight] = useState(false);
  const unit = units.find((item) => item.id === unitId) ?? units[0];
  const content = project.config?.content ?? {};
  const runtimeAssets = {
    unitModel: resolveShowroomAsset(project, 'unitModel'),
    interiorModel: resolveShowroomAsset(project, 'interiorRender'),
    panorama360: resolveShowroomAsset(project, 'panorama360'),
  };

  return <div className={`apartment-interior ${night ? 'night' : ''}`}>
    <header className="ai-nav">
      <div><span>{project.name}</span><small>INTERIOR EXPERIENCE · {engine.mode.toUpperCase()}</small></div>
      <div className="ai-actions">
        <label>UNIDAD <select value={unit?.id ?? ''} onChange={(event) => setUnitId(event.target.value)}>{units.map((item) => <option key={item.id} value={item.id}>{item.number} · {item.surface ?? item.area ?? 0} m²</option>)}</select></label>
        <button onClick={() => setNight((value) => !value)}>{night ? 'Día' : 'Atardecer'}</button>
      </div>
    </header>
    <main className="ai-stage">
      <Scene assets={runtimeAssets} room={room} night={night} />
      <div className="ai-copy"><span>UNIDAD {unit?.number ?? '—'} · PISO {unit?.floor ?? '—'}</span><h1>Entrá. Viví el espacio.</h1><p>{content.heroSubtitle ?? 'Recorré el departamento ambiente por ambiente antes de elegir tu unidad.'}</p></div>
      <div className="ai-roombar">{ROOMS.map((item) => <button key={item.id} className={room === item.id ? 'active' : ''} onClick={() => setRoom(item.id)}>{item.label}</button>)}</div>
      <div className="ai-spec"><strong>{unit?.surface ?? unit?.area ?? 0} m²</strong><span>{unit?.bedrooms ?? 0} dormitorios · {unit?.bathrooms ?? 0} baños</span><b>{unit?.price ? `$${Number(unit.price).toLocaleString('en-US')}` : 'Consultar'}</b></div>
      <div className="ai-hint"><span>ARRASTRÁ PARA EXPLORAR</span><span>SCROLL · ZOOM</span></div>
    </main>
  </div>;
}
