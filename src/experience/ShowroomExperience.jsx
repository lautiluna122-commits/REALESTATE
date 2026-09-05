import { Canvas, useFrame } from '@react-three/fiber';
import { ContactShadows, Environment, Html, OrbitControls, RoundedBox, Sky } from '@react-three/drei';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Vector3 } from 'three';
import { getProjectBySlug } from '../platform/projectRegistry';
import { STATUS_LABELS } from '../domain/platformModels';

const pathname = typeof window !== 'undefined' ? window.location.pathname.replace(/\/+$/, '') : '/';
const routeMatch = pathname.match(/^\/proyecto\/([^/]+)$/);
const project = getProjectBySlug(routeMatch?.[1] ?? 'ocean-mansions');
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

function LowRise({ position, scale = 1, night }) {
  return <group position={position} scale={scale}>
    <RoundedBox args={[10, 3.2, 7]} radius={.28} smoothness={4} position={[0, 1.6, 0]} castShadow><meshStandardMaterial color="#bcb5aa" roughness={.78} /></RoundedBox>
    <mesh position={[0, 2.0, 3.53]}><boxGeometry args={[8.4, 1.5, .12]} /><meshStandardMaterial color={night ? '#b68d4f' : '#78969c'} roughness={.16} metalness={.55} emissive={night ? '#7a4b19' : '#173e48'} emissiveIntensity={night ? .35 : .04} /></mesh>
    <mesh position={[0, 3.18, 0]}><boxGeometry args={[10.8, .16, 7.6]} /><meshStandardMaterial color="#8f887e" roughness={.7} /></mesh>
  </group>;
}

function PoolArea({ night }) {
  return <group position={[0, 0, 12]}>
    <RoundedBox args={[27, .35, 13]} radius={.35} smoothness={4} position={[0, .18, 0]} receiveShadow><meshStandardMaterial color="#d2c5b2" roughness={.8} /></RoundedBox>
    <RoundedBox args={[16.5, .28, 6.8]} radius={.45} smoothness={5} position={[0, .43, 0]} receiveShadow><meshStandardMaterial color={night ? '#456d78' : COLORS.water} roughness={.1} metalness={.18} emissive={night ? '#1d3940' : '#16404a'} emissiveIntensity={night ? .35 : .08} /></RoundedBox>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, .58, 0]}><planeGeometry args={[14.8, 5.3]} /><meshStandardMaterial color="#83c0c7" transparent opacity={.42} roughness={.05} /></mesh>
    {[-9.5, 9.5].map((x) => <group key={x} position={[x, .55, 0]}>{[-2.4, 0, 2.4].map((z) => <RoundedBox key={z} args={[2.2, .22, .8]} radius={.12} smoothness={3} position={[0, 0, z]} rotation={[0, 0, x < 0 ? -.08 : .08]}><meshStandardMaterial color="#e9e1d3" roughness={.75} /></RoundedBox>)}</group>)}
    <mesh position={[0, .42, 3.95]}><boxGeometry args={[17, .12, .35]} /><meshStandardMaterial color={COLORS.sand} roughness={.7} /></mesh>
  </group>;
}

function FacadeUnit({ unit, x, y, z, selected, night, onSelect }) {
  const color = statusColor(unit.status, selected);
  return <group position={[x, y, z]}>
    <RoundedBox args={[2.95, 2.05, .5]} radius={.08} smoothness={3}><meshStandardMaterial color={selected ? '#e4d4b1' : '#d8d2c8'} roughness={.62} metalness={.15} transparent opacity={selected ? .98 : .94} /></RoundedBox>
    <mesh position={[0, .12, .31]} onClick={(event) => { event.stopPropagation(); onSelect(unit); }} onPointerOver={() => { document.body.style.cursor = 'pointer'; }} onPointerOut={() => { document.body.style.cursor = 'default'; }}>
      <boxGeometry args={[2.45, 1.52, .12]} /><meshStandardMaterial color={night ? COLORS.glassNight : COLORS.glass} roughness={.1} metalness={.65} emissive={night ? '#8f5d20' : color} emissiveIntensity={selected ? .85 : night ? .35 : .06} />
    </mesh>
    <mesh position={[0, -.92, .46]} castShadow><boxGeometry args={[3.28, .14, 1.35]} /><meshStandardMaterial color="#c4b29d" roughness={.7} /></mesh>
    <mesh position={[0, -.08, 1.05]}><boxGeometry args={[2.5, .08, .08]} /><meshStandardMaterial color={selected ? '#e4c26f' : COLORS.metal} metalness={.85} roughness={.25} /></mesh>
    {[-1.15, -.38, .38, 1.15].map((rx) => <mesh key={rx} position={[rx, -.45, .96]}><cylinderGeometry args={[.025, .025, .92, 8]} /><meshStandardMaterial color={COLORS.metal} metalness={.9} roughness={.2} /></mesh>)}
    {selected && <Html center distanceFactor={11} position={[0, 1.55, .5]}><button className="unit-hotspot" onClick={(event) => { event.stopPropagation(); onSelect(unit); }}>UNIT {unit.number}<span>{statusLabel(unit.status)}</span></button></Html>}
  </group>;
}

function Tower({ selectedFloor, selectedUnit, night, onSelectUnit }) {
  const floorHeight = 2.72; const podiumTop = 4.3;
  return <group>
    <RoundedBox args={[17.5, 3.8, 12]} radius={.45} smoothness={5} position={[0, 2.05, 0]} castShadow receiveShadow><meshStandardMaterial color={COLORS.concreteDark} roughness={.72} /></RoundedBox>