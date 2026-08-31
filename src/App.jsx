import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Sky } from '@react-three/drei';
import { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { getProjectById } from './platform/projectRegistry';
import { STATUS_LABELS } from './domain/platformModels';

const project = getProjectById();
const apartments = project.units;
const amenityList = project.amenities.map((item) => ({
  name: item.name,
  detail: item.description,
}));

const locationPoints = [
  { name: 'Playa', x: 30, y: 28 },
  { name: 'Puerto', x: 58, y: 24 },
  { name: 'Restaurantes', x: 72, y: 46 },
  { name: 'Shopping', x: 42, y: 64 },
  { name: 'Aeropuerto', x: 20, y: 75 },
];

const defaultApartment = apartments.find((unit) => unit.id === '804') ?? apartments[0];

function formatPrice(value) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}

function getStatusTone(status) {
  const normalized = STATUS_LABELS[status] ?? status;
  if (normalized === 'Disponible') return 'available';
  if (normalized === 'Reservado') return 'reserved';
  return 'sold';
}

function Car({ position, scale = 1 }) {
  return (
    <group position={position} scale={scale}>
      <mesh castShadow position={[0, 0.42, 0]}>
        <boxGeometry args={[1.7, 0.5, 0.9]} />
        <meshStandardMaterial color="#b7bec6" metalness={0.7} roughness={0.4} />
      </mesh>
      <mesh castShadow position={[0.15, 0.8, 0]}>
        <boxGeometry args={[0.9, 0.45, 0.8]} />
        <meshStandardMaterial color="#dfe3e8" metalness={0.5} roughness={0.3} />
      </mesh>
      {[[-0.55, 0.15, -0.38], [0.55, 0.15, -0.38], [-0.55, 0.15, 0.38], [0.55, 0.15, 0.38]].map((wheel, index) => (
        <mesh key={index} castShadow position={wheel} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.18, 0.18, 0.12, 16]} />
          <meshStandardMaterial color="#1d1f22" />
        </mesh>
      ))}
    </group>
  );
}

function PalmTree({ position, scale = 1 }) {
  return (
    <group position={position} scale={scale}>
      <mesh castShadow position={[0, 1.2, 0]}>
        <cylinderGeometry args={[0.12, 0.18, 2.4, 12]} />
        <meshStandardMaterial color="#8c5f3a" />
      </mesh>
      {[-1, 1].map((dir) => (
        <mesh key={dir} castShadow position={[0, 2.1, 0]} rotation={[0, 0, dir * 0.8]}>
          <coneGeometry args={[0.4, 2.8, 8, 1, true]} />
          <meshStandardMaterial color="#4b8f5c" />
        </mesh>
      ))}
    </group>
  );
}

function PineTree({ position, scale = 1 }) {
  return (
    <group position={position} scale={scale}>
      <mesh castShadow position={[0, 1.2, 0]}>
        <cylinderGeometry args={[0.12, 0.18, 2.4, 10]} />
        <meshStandardMaterial color="#7f5840" />
      </mesh>
      <mesh castShadow position={[0, 2.8, 0]}>
        <coneGeometry args={[0.9, 2.4, 10]} />
        <meshStandardMaterial color="#4d7350" />
      </mesh>
      <mesh castShadow position={[0, 3.8, 0]}>
        <coneGeometry args={[0.6, 1.8, 10]} />
        <meshStandardMaterial color="#517c59" />
      </mesh>
    </group>
  );
}

function SmallBuilding({ position, scale = [1, 1, 1], height = 3 }) {
  return (
    <group position={position} scale={scale}>
      <mesh castShadow receiveShadow position={[0, height / 2, 0]}>
        <boxGeometry args={[3.2, height, 2.8]} />
        <meshStandardMaterial color="#d8d3cf" roughness={0.9} metalness={0.1} />
      </mesh>
      {[-1, 1].map((dir) => (
        <mesh key={dir} castShadow position={[dir * 0.9, height / 2 + 0.2, 0.2]}>
          <boxGeometry args={[0.5, height * 0.7, 0.2]} />
          <meshStandardMaterial color="#cad3dc" />
        </mesh>
      ))}
    </group>
  );
}

function BalconyRail({ position = [0, 0, 0], size = [2.2, 0.9, 0.18] }) {
  return (
    <group position={position}>
      <mesh castShadow position={[0, 0.15, 0]}>
        <boxGeometry args={size} />
        <meshStandardMaterial color="#dcdedc" metalness={0.3} roughness={0.5} />
      </mesh>
      {Array.from({ length: 6 }).map((_, index) => (
        <mesh key={index} castShadow position={[-size[0] / 2 + 0.25 + index * 0.45, 0.18, 0.08]}>
          <boxGeometry args={[0.06, 0.7, 0.06]} />
          <meshStandardMaterial color="#7a7f83" metalness={0.8} roughness={0.25} />
        </mesh>
      ))}
    </group>
  );
}

function BalconySet({ x = 0, y = 0, width = 2.2, depth = 1.2 }) {
  return (
    <group position={[x, y, 4.9]}>
      <mesh castShadow receiveShadow position={[0, -0.2, 0]}>
        <boxGeometry args={[width + 0.3, 0.2, depth + 0.5]} />
        <meshStandardMaterial color="#c4b7a4" roughness={0.9} />
      </mesh>
      <BalconyRail position={[0, 0.05, 0]} size={[width, 0.9, 0.18]} />
    </group>
  );
}

function WindowBand({ x = 0, y = 0, z = 0, width = 2.2, height = 0.9 }) {
  return (
    <group position={[x, y, z]}>
      <mesh castShadow position={[0, 0, 0.12]}>
        <boxGeometry args={[width, height, 0.08]} />
        <meshStandardMaterial color="#cfe3f1" roughness={0.18} metalness={0.45} transparent opacity={0.88} />
      </mesh>
      <mesh castShadow position={[0, 0, -0.04]}>
        <boxGeometry args={[width + 0.12, height + 0.12, 0.04]} />
        <meshStandardMaterial color="#8fa4b0" metalness={0.7} roughness={0.35} />
      </mesh>
    </group>
  );
}

function ApartmentFacade({ unit, selected, onSelect }) {
  const statusColor =
    unit.status === 'Disponible' ? '#a5d3bf' : unit.status === 'Reservado' ? '#d5b058' : '#d99090';

  const xIndex = (unit.number - 1) % 4;
  const x = -4.8 + xIndex * 3.2;
  const width = 2.5;
  const depth = 1.5;

  return (
    <group position={[x, 0, 4.2]}>
      <mesh
        castShadow
        receiveShadow
        onClick={(event) => {
          event.stopPropagation();
          onSelect(unit);
        }}
        onPointerOver={(event) => {
          event.stopPropagation();
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'default';
        }}
      >
        <boxGeometry args={[width, 1.2, depth]} />
        <meshStandardMaterial
          color={selected ? '#d9bd73' : statusColor}
          emissive={selected ? '#7a5d1d' : '#000000'}
          emissiveIntensity={selected ? 0.7 : 0.1}
          roughness={0.75}
          metalness={0.25}
        />
      </mesh>

      <WindowBand x={0} y={0.15} z={0.96} width={2.0} height={0.72} />
      <WindowBand x={0} y={0.15} z={1.28} width={2.0} height={0.72} />

      <mesh position={[0, -0.25, 1.18]} castShadow>
        <boxGeometry args={[2.7, 0.2, 1.2]} />
        <meshStandardMaterial color="#c7c3bf" roughness={0.9} />
      </mesh>

      <mesh position={[0, 0.2, 1.36]} castShadow>
        <boxGeometry args={[2.6, 0.1, 0.2]} />
        <meshStandardMaterial color="#7c7d7f" />
      </mesh>

      <BalconySet x={0} y={-0.2} width={2.7} depth={1.3} />
    </group>
  );
}

function FloorStack({ floor, selectedFloor, selectedApartment, onSelectApartment }) {
  const floorUnits = apartments.filter((unit) => unit.floor === floor);
  const isActive = selectedFloor === null || selectedFloor === floor;
  const floorY = 1.5 + (floor - 1) * 2.7;

  return (
    <group position={[0, floorY, 0]}>
      <mesh castShadow receiveShadow position={[0, 0, 0]}>
        <boxGeometry args={[15.5, 0.9, 10.5]} />
        <meshStandardMaterial
          color={isActive ? '#d4d0cc' : '#b0b0b0'}
          roughness={0.8}
          metalness={0.16}
          emissive={isActive ? '#9ea4aa' : '#1d1f22'}
          emissiveIntensity={isActive ? 0.08 : 0.03}
        />
      </mesh>

      <mesh position={[0, 0.12, 0]} castShadow receiveShadow>
        <boxGeometry args={[15.7, 0.2, 10.7]} />
        <meshStandardMaterial color="#b8b3ad" />
      </mesh>

      <mesh position={[0, 0.38, 4.8]} castShadow receiveShadow>
        <boxGeometry args={[13.8, 0.3, 1.1]} />
        <meshStandardMaterial color="#c7c0ba" roughness={0.9} />
      </mesh>

      <mesh position={[0, 0.34, -4.7]} castShadow receiveShadow>
        <boxGeometry args={[13.8, 0.3, 1.1]} />
        <meshStandardMaterial color="#c7c0ba" roughness={0.9} />
      </mesh>

      {floorUnits.map((unit) => (
        <ApartmentFacade key={unit.id} unit={unit} selected={selectedApartment?.id === unit.id} onSelect={onSelectApartment} />
      ))}
    </group>
  );
}

function BuildingModel({ selectedFloor, selectedApartment, onSelectApartment, nightMode }) {
  const residentialFloors = Array.from({ length: 12 }, (_, index) => index + 1);

  return (
    <>
      <ambientLight intensity={nightMode ? 0.65 : 1.2} color={nightMode ? '#dfe9ff' : '#f5f3f1'} />
      <directionalLight
        castShadow
        position={[18, 30, 18]}
        intensity={nightMode ? 0.9 : 1.8}
        color={nightMode ? '#d8bc95' : '#fff4dd'}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <pointLight position={[-8, 6, 8]} intensity={nightMode ? 1.1 : 0.5} color="#edf5ff" />
      <pointLight position={[0, 18, 12]} intensity={nightMode ? 0.8 : 0.2} color="#f9d6a8" />

      <Sky distance={450000} sunPosition={nightMode ? [1, -0.4, 1] : [8, 3, 4]} inclination={nightMode ? 0.8 : 0.52} azimuth={0.2} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.2, 0]} receiveShadow>
        <planeGeometry args={[120, 120]} />
        <meshStandardMaterial color={nightMode ? '#2a2f34' : '#dfead1'} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 17]} receiveShadow>
        <planeGeometry args={[36, 7]} />
        <meshStandardMaterial color="#bdbdb6" />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 19.6]} receiveShadow>
        <planeGeometry args={[18, 1.7]} />
        <meshStandardMaterial color="#d5d5d0" />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.09, 25]} receiveShadow>
        <planeGeometry args={[32, 7]} />
        <meshStandardMaterial color="#cad6d1" />
      </mesh>

      <mesh position={[0, 0.5, 0]} receiveShadow>
        <boxGeometry args={[21, 0.9, 14]} />
        <meshStandardMaterial color="#d8d1ca" roughness={0.9} />
      </mesh>

      <group position={[0, 0, 0]}>
        <mesh position={[0, 1.8, 0]} castShadow receiveShadow>
          <boxGeometry args={[18, 3.2, 11]} />
          <meshStandardMaterial color="#d5d4d0" roughness={0.8} metalness={0.22} />
        </mesh>

        <mesh position={[0, 2.1, 5.15]} castShadow>
          <boxGeometry args={[9.8, 1.9, 0.5]} />
          <meshStandardMaterial color="#c5c9d1" metalness={0.45} roughness={0.4} />
        </mesh>

        <mesh position={[0, 2.3, 5.5]} castShadow>
          <boxGeometry args={[4.6, 0.9, 0.18]} />
          <meshStandardMaterial color="#e7e6e2" metalness={0.18} roughness={0.75} />
        </mesh>

        <mesh position={[0, 0.95, 5.05]} castShadow>
          <boxGeometry args={[8.1, 0.7, 0.2]} />
          <meshStandardMaterial color="#9aa8b3" roughness={0.5} metalness={0.43} />
        </mesh>

        <mesh position={[0, 0.7, 4.2]} castShadow>
          <boxGeometry args={[8.5, 1.3, 1.8]} />
          <meshStandardMaterial color="#c6c2bd" />
        </mesh>

        <mesh position={[0, 2.2, 4.95]} castShadow>
          <boxGeometry args={[6.5, 2.6, 0.25]} />
          <meshStandardMaterial color="#a8b8c7" transparent opacity={0.8} />
        </mesh>

        <mesh position={[-0.05, 1.5, 5.6]} castShadow>
          <boxGeometry args={[7.5, 2.6, 0.12]} />
          <meshStandardMaterial color="#ccd6db" emissive={nightMode ? '#a7d0fb' : '#000000'} emissiveIntensity={nightMode ? 0.5 : 0.05} />
        </mesh>

        <mesh position={[-6, 1.6, 4.9]} castShadow>
          <boxGeometry args={[0.28, 2.9, 0.28]} />
          <meshStandardMaterial color="#7a7d80" />
        </mesh>
        <mesh position={[6, 1.6, 4.9]} castShadow>
          <boxGeometry args={[0.28, 2.9, 0.28]} />
          <meshStandardMaterial color="#7a7d80" />
        </mesh>

        <mesh position={[-8.2, 1.3, -2.5]} castShadow>
          <boxGeometry args={[1.1, 2.8, 1.1]} />
          <meshStandardMaterial color="#c7c6c1" roughness={0.8} />
        </mesh>
        <mesh position={[8.2, 1.3, -2.5]} castShadow>
          <boxGeometry args={[1.1, 2.8, 1.1]} />
          <meshStandardMaterial color="#c7c6c1" roughness={0.8} />
        </mesh>

        {[-5.4, 5.4].map((x) => (
          <mesh key={x} position={[x, 1.5, 6.2]} castShadow>
            <boxGeometry args={[1.4, 2.7, 1.2]} />
            <meshStandardMaterial color="#d4d5d0" roughness={0.82} />
          </mesh>
        ))}

        <mesh position={[0, 0.2, -5.2]} castShadow>
          <boxGeometry args={[17, 0.3, 0.9]} />
          <meshStandardMaterial color="#a8a39c" />
        </mesh>

        <mesh position={[0, 0.85, 4.8]} castShadow>
          <boxGeometry args={[9.5, 0.1, 0.6]} />
          <meshStandardMaterial color="#d9d4ce" />
        </mesh>
      </group>

      <group position={[0, 31.5, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[15.5, 0.4, 9.8]} />
          <meshStandardMaterial color="#d2cdc6" roughness={0.85} />
        </mesh>
        <mesh position={[0, 0.35, 0]} castShadow>
          <boxGeometry args={[8.2, 0.3, 4.8]} />
          <meshStandardMaterial color="#cfe7e8" transparent opacity={0.9} />
        </mesh>
        <mesh position={[0, 0.8, 0]} castShadow>
          <boxGeometry args={[6.8, 0.12, 3.8]} />
          <meshStandardMaterial color="#b9d8e0" transparent opacity={0.9} />
        </mesh>
        {[-3.2, 0, 3.2].map((x) => (
          <mesh key={x} castShadow position={[x, 0.7, -1.2]}>
            <boxGeometry args={[2.1, 0.4, 0.7]} />
            <meshStandardMaterial color="#a7b7c2" />
          </mesh>
        ))}
      </group>

      <group>
        {residentialFloors.map((floor) => (
          <FloorStack
            key={floor}
            floor={floor}
            selectedFloor={selectedFloor}
            selectedApartment={selectedApartment}
            onSelectApartment={onSelectApartment}
          />
        ))}
      </group>

      <group position={[0, 34, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[16.5, 0.6, 10.8]} />
          <meshStandardMaterial color="#c8c2bc" roughness={0.85} />
        </mesh>
        <mesh position={[0, 0.2, 0]} castShadow>
          <boxGeometry args={[9, 0.25, 6.5]} />
          <meshStandardMaterial color="#dfe7e5" />
        </mesh>
        <mesh position={[0, 0.52, 0]} castShadow>
          <boxGeometry args={[7.8, 0.18, 5.3]} />
          <meshStandardMaterial color="#c7d7d0" />
        </mesh>
        {[-3.8, 0, 3.8].map((x) => (
          <mesh key={x} position={[x, 0.7, -2.2]} castShadow>
            <boxGeometry args={[2.6, 0.5, 0.9]} />
            <meshStandardMaterial color="#c7d0d6" />
          </mesh>
        ))}
      </group>

      <mesh position={[0, 0.08, 20]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[30, 9]} />
        <meshStandardMaterial color={nightMode ? '#1c2f3e' : '#dfe7d8'} />
      </mesh>

      <group position={[-20, 0, -10]}>
        <PalmTree position={[0, 0, 0]} scale={1.2} />
        <PalmTree position={[5, 0, 3]} scale={1.1} />
        <PineTree position={[-6, 0, -2]} scale={1.4} />
        <PalmTree position={[10, 0, -4]} scale={1} />
      </group>

      <group position={[18, 0, -16]}>
        <SmallBuilding position={[0, 0, 0]} height={4.5} scale={[1, 1, 1]} />
        <SmallBuilding position={[-6, 0, 3]} height={3.8} scale={[0.9, 0.9, 0.9]} />
        <SmallBuilding position={[8, 0, 5]} height={5.2} scale={[1.1, 1.1, 1.1]} />
      </group>

      <group position={[-14, 0, 18]}>
        <Car position={[0, 0, 0]} scale={1.2} />
        <Car position={[8, 0, 1]} scale={0.9} />
      </group>

      <mesh position={[0, 0.1, 1]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[9, 32]} />
        <meshStandardMaterial color="#dfe6d8" />
      </mesh>

      <mesh position={[0, 0.05, 28]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[90, 32]} />
        <meshStandardMaterial color={nightMode ? '#0f2136' : '#7fb5d0'} transparent opacity={0.9} />
      </mesh>

      <mesh position={[0, 0.08, 40]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[80, 18]} />
        <meshStandardMaterial color={nightMode ? '#0a1d2d' : '#cce8f4'} transparent opacity={0.7} />
      </mesh>

      <mesh position={[0, 0.07, 46]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[120, 20]} />
        <meshStandardMaterial color={nightMode ? '#11263c' : '#d7edf8'} transparent opacity={0.8} />
      </mesh>

      <mesh position={[0, -0.02, 56]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[160, 34]} />
        <meshStandardMaterial color={nightMode ? '#0f1d2c' : '#cfe7f4'} transparent opacity={0.7} />
      </mesh>
    </>
  );
}

function CameraRig({ selectedFloor, selectedApartment, viewMode }) {
  const { camera } = useThree();
  const controlsRef = useRef(null);

  useFrame(() => {
    const targetY = selectedFloor ? selectedFloor * 2.7 + 2.4 : 18;
    const desiredTarget = new THREE.Vector3(0, targetY, 0);
    const desiredPosition = new THREE.Vector3(20, 14, 24);

    if (viewMode === 'interior' && selectedApartment) {
      desiredPosition.set(7, 4.5, 10);
      desiredTarget.set(0, 3, 0);
    }

    if (controlsRef.current) {
      controlsRef.current.target.lerp(desiredTarget, 0.08);
    }

    camera.position.lerp(desiredPosition, 0.06);
    camera.lookAt(desiredTarget);
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan
      enableZoom
      enableDamping
      dampingFactor={0.08}
      minDistance={9}
      maxDistance={31}
      minPolarAngle={Math.PI / 5}
      maxPolarAngle={Math.PI / 2.08}
      target={[0, 12, 0]}
    />
  );
}

function InteriorView({ apartment }) {
  if (!apartment) return null;

  return (
    <group position={[0, 0, 0]}>
      <mesh position={[0, 0.05, 0]} receiveShadow>
        <boxGeometry args={[10.5, 0.2, 8.5]} />
        <meshStandardMaterial color="#d7d0c8" />
      </mesh>
      <mesh position={[0, 2.7, 0]} receiveShadow>
        <boxGeometry args={[10.5, 0.12, 8.5]} />
        <meshStandardMaterial color="#f0efe9" />
      </mesh>
      <mesh position={[0, 1.3, -4.1]}>
        <boxGeometry args={[10.4, 2.6, 0.15]} />
        <meshStandardMaterial color="#e8e0d3" />
      </mesh>
      <mesh position={[-4.8, 1.3, 0]}>
        <boxGeometry args={[0.15, 2.6, 8.2]} />
        <meshStandardMaterial color="#e8e0d3" />
      </mesh>
      <mesh position={[4.8, 1.3, 0]}>
        <boxGeometry args={[0.15, 2.6, 8.2]} />
        <meshStandardMaterial color="#e8e0d3" />
      </mesh>

      <mesh position={[0, 0.85, 2.8]}>
        <boxGeometry args={[4.5, 1.5, 0.12]} />
        <meshStandardMaterial color="#b8d3e4" transparent opacity={0.9} />
      </mesh>

      <mesh position={[-2.5, 0.38, -0.7]} castShadow>
        <boxGeometry args={[2.9, 0.4, 2.0]} />
        <meshStandardMaterial color="#7b7d7b" />
      </mesh>
      <mesh position={[-2.5, 0.75, 1.3]} castShadow>
        <boxGeometry args={[2.4, 0.12, 1.1]} />
        <meshStandardMaterial color="#c9a36d" />
      </mesh>
      <mesh position={[2.4, 0.45, 0.6]} castShadow>
        <boxGeometry args={[2.7, 0.2, 1.5]} />
        <meshStandardMaterial color="#b89468" />
      </mesh>
      <mesh position={[2.4, 0.62, -1.8]} castShadow>
        <boxGeometry args={[1.5, 0.6, 1.3]} />
        <meshStandardMaterial color="#8ca2a4" />
      </mesh>
      <mesh position={[0, 0.42, -2.2]} castShadow>
        <boxGeometry args={[1.8, 0.2, 1.1]} />
        <meshStandardMaterial color="#d7d0c7" />
      </mesh>
      <mesh position={[0, 0.8, 0]} castShadow>
        <boxGeometry args={[2.7, 0.9, 1.7]} />
        <meshStandardMaterial color="#e9d9bf" />
      </mesh>
    </group>
  );
}

function FloorPlanModal({ apartment, onClose }) {
  if (!apartment) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="plan-modal" onClick={(e) => e.stopPropagation()}>
        <div className="plan-header">
          <div>
            <div className="eyebrow">Plano</div>
            <h3>Unidad {apartment.number}</h3>
          </div>
          <button className="secondary-btn" onClick={onClose}>Cerrar</button>
        </div>

        <svg viewBox="0 0 720 500" className="plan-svg" aria-label="Plano de apartamento">
          <rect x="40" y="40" width="640" height="420" rx="18" fill="#f8f4ef" stroke="#d9c8b6" strokeWidth="1.5" />
          <rect x="65" y="65" width="240" height="170" rx="14" fill="#dfe9ee" stroke="#becbd3" />
          <rect x="335" y="65" width="300" height="150" rx="14" fill="#e4d7c5" stroke="#c7b294" />
          <rect x="65" y="260" width="210" height="170" rx="14" fill="#dfe5d8" stroke="#b8c0ae" />
          <rect x="305" y="260" width="150" height="170" rx="14" fill="#dfe5ea" stroke="#b9c5d0" />
          <rect x="485" y="260" width="155" height="170" rx="14" fill="#dfe2e8" stroke="#bcc5d0" />
          <rect x="515" y="115" width="100" height="80" rx="12" fill="#e1dfdd" stroke="#b8b2af" />
          <rect x="110" y="305" width="100" height="70" rx="12" fill="#c9d7e5" stroke="#7e90a1" />
          <rect x="360" y="315" width="70" height="80" rx="12" fill="#d4d8d0" stroke="#94a29a" />
          <text x="134" y="150" fontSize="20" fill="#2a2a2a">Living</text>
          <text x="412" y="150" fontSize="20" fill="#2a2a2a">Cocina</text>
          <text x="88" y="340" fontSize="20" fill="#2a2a2a">Dormitorio principal</text>
          <text x="325" y="360" fontSize="20" fill="#2a2a2a">Dormitorio 2</text>
          <text x="510" y="300" fontSize="20" fill="#2a2a2a">Baño</text>
          <text x="190" y="465" fontSize="20" fill="#2a2a2a">Terraza</text>
        </svg>
      </div>
    </div>
  );
}

function App() {
  const [selectedFloor, setSelectedFloor] = useState(8);
  const [selectedApartment, setSelectedApartment] = useState(defaultApartment);
  const [showPlan, setShowPlan] = useState(false);
  const [viewMode, setViewMode] = useState('building');
  const [nightMode, setNightMode] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [section, setSection] = useState('project');
  const [filters, setFilters] = useState({ bedrooms: 'any', maxPrice: 600000, status: 'all' });

  const filteredUnits = useMemo(() => {
    return apartments.filter((unit) => {
      const normalizedStatus = STATUS_LABELS[unit.status] ?? unit.status;
      const bedroomsOk = filters.bedrooms === 'any' || unit.bedrooms >= Number(filters.bedrooms);
      const priceOk = unit.price <= filters.maxPrice;
      const statusOk = filters.status === 'all' || normalizedStatus === filters.status;
      return bedroomsOk && priceOk && statusOk;
    });
  }, [filters]);

  const handleSelectFloor = (floor) => {
    setSelectedFloor(floor);
    const floorUnit = apartments.find((unit) => unit.floor === floor);
    setSelectedApartment(floorUnit || selectedApartment);
    setViewMode('building');
  };

  const handleSelectApartment = (unit) => {
    setSelectedApartment(unit);
    setSelectedFloor(unit.floor);
    setViewMode('building');
  };

  const handleExploreUnit = () => {
    if (selectedApartment) {
      setViewMode('interior');
      setSelectedFloor(selectedApartment.floor);
    }
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-block">
          <div className="brand">OCEAN RESIDENCES</div>
          <div className="brand-subtitle">Punta del Este, Uruguay</div>
        </div>

        <nav className="main-nav">
          {['project', 'units', 'amenities', 'location', 'contact'].map((item) => (
            <button key={item} className={`nav-pill ${section === item ? 'active' : ''}`} onClick={() => setSection(item)}>
              {item === 'project' ? 'Proyecto' : item === 'units' ? 'Unidades' : item === 'amenities' ? 'Amenities' : item === 'location' ? 'Ubicación' : 'Contacto'}
            </button>
          ))}
        </nav>
      </header>

      <main className="showroom-shell">
        <section className="hero-stage">
          <div className="scene-wrap">
            <Canvas shadows camera={{ position: [20, 14, 24], fov: 38 }}>
              <color attach="background" args={[nightMode ? '#0b1220' : '#edf5fb']} />
              <BuildingModel
                selectedFloor={selectedFloor}
                selectedApartment={selectedApartment}
                onSelectApartment={handleSelectApartment}
                nightMode={nightMode}
              />
              {viewMode === 'interior' && selectedApartment && <InteriorView apartment={selectedApartment} />}
              <CameraRig selectedFloor={selectedFloor} selectedApartment={selectedApartment} viewMode={viewMode} />
            </Canvas>
          </div>

          <div className="hero-overlay">
            <div className="project-title-block">
              <div className="eyebrow">Residential showroom</div>
              <h1>OCEAN RESIDENCES</h1>
              <p>Digital Property Experience</p>
            </div>

            <div className="hero-actions">
              <button className="primary-btn" onClick={() => setSelectedFloor(8)}>Explorar proyecto</button>
              <button className="ghost-btn" onClick={() => setNightMode((value) => !value)}>{nightMode ? 'Modo día' : 'Modo noche'}</button>
            </div>
          </div>

          <aside className="floor-rail">
            <div className="floating-label">Pisos</div>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((floor) => (
              <button
                key={floor}
                className={`floor-button ${selectedFloor === floor ? 'active' : ''}`}
                onClick={() => handleSelectFloor(floor)}
              >
                {`0${floor}`}
              </button>
            ))}
          </aside>

          {selectedApartment && (
            <aside className="unit-card">
              <div className="eyebrow">Unidad {selectedApartment.number}</div>
              <div className="mini-meta">{selectedApartment.floor}º piso</div>
              <div className="unit-price">{formatPrice(selectedApartment.price)}</div>
              <div className="unit-specs">
                <span>{selectedApartment.bedrooms} dormitorios</span>
                <span>{selectedApartment.surface} m²</span>
                <span>{selectedApartment.terrace} m² terraza</span>
              </div>
              <div className={`unit-status ${getStatusTone(selectedApartment.status)}`}>{STATUS_LABELS[selectedApartment.status] ?? selectedApartment.status}</div>
              <div className="card-actions">
                <button className="primary-btn" onClick={() => setShowPlan(true)}>Ver plano</button>
                <button className="secondary-btn" onClick={handleExploreUnit}>Explorar</button>
              </div>
            </aside>
          )}
        </section>

        <section className="below-hero">
          <div className="info-band">
            <div>
              <div className="eyebrow">Proyecto</div>
              <h2>Showroom digital para ventas</h2>
            </div>
            <div className="stats-grid">
              <div><span>48</span><small>Unidades</small></div>
              <div><span>12</span><small>Pisos</small></div>
              <div><span>4</span><small>Por piso</small></div>
              <div><span>4</span><small>Amenities</small></div>
            </div>
          </div>

          <div className="content-grid">
            <div className="panel module">
              <div className="panel-header">
                <div className="eyebrow">Encontrá tu unidad</div>
                <h3>Buscador</h3>
              </div>

              <div className="filters-row">
                <select value={filters.bedrooms} onChange={(e) => setFilters((prev) => ({ ...prev, bedrooms: e.target.value }))}>
                  <option value="any">Dormitorios</option>
                  <option value="2">2+</option>
                  <option value="3">3+</option>
                  <option value="4">4+</option>
                </select>

                <select value={filters.status} onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}>
                  <option value="all">Todos los estados</option>
                  <option value="Disponible">Disponible</option>
                  <option value="Reservado">Reservado</option>
                  <option value="Vendida">Vendida</option>
                </select>

                <input
                  type="range"
                  min="200000"
                  max="600000"
                  step="5000"
                  value={filters.maxPrice}
                  onChange={(e) => setFilters((prev) => ({ ...prev, maxPrice: Number(e.target.value) }))}
                />
              </div>

              <div className="finder-list">
                {filteredUnits.slice(0, 8).map((unit) => (
                  <button key={unit.id} className="finder-item" onClick={() => handleSelectApartment(unit)}>
                    <span>Unidad {unit.number}</span>
                    <strong>{unit.bedrooms}BR</strong>
                    <small>{STATUS_LABELS[unit.status] ?? unit.status}</small>
                  </button>
                ))}
              </div>
            </div>

            <div className="panel module amenity-panel">
              <div className="panel-header">
                <div className="eyebrow">Amenities</div>
                <h3>Experiencia del proyecto</h3>
              </div>

              <div className="amenity-list">
                {amenityList.map((item) => (
                  <div key={item.name} className="amenity-card">
                    <div className="amenity-name">{item.name}</div>
                    <p>{item.detail}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel module map-panel">
              <div className="panel-header">
                <div className="eyebrow">Ubicación</div>
                <h3>Punta del Este</h3>
              </div>

              <div className="map-surface">
                {locationPoints.map((point) => (
                  <div key={point.name} className="map-point" style={{ left: `${point.x}%`, top: `${point.y}%` }}>
                    {point.name}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      {showPlan && selectedApartment && <FloorPlanModal apartment={selectedApartment} onClose={() => setShowPlan(false)} />}

      {viewMode === 'interior' && selectedApartment && (
        <button className="return-building" onClick={() => setViewMode('building')}>
          Volver al edificio
        </button>
      )}

      {showContact && (
        <div className="modal-backdrop" onClick={() => setShowContact(false)}>
          <div className="contact-modal" onClick={(event) => event.stopPropagation()}>
            <div className="plan-header">
              <div>
                <div className="eyebrow">Consulta</div>
                <h3>Solicitar información</h3>
              </div>
              <button className="secondary-btn" onClick={() => setShowContact(false)}>Cerrar</button>
            </div>

            <form className="contact-form">
              <input type="text" placeholder="Nombre" />
              <input type="email" placeholder="Email" />
              <input type="tel" placeholder="Teléfono" />
              <input type="text" placeholder="Unidad de interés" value={selectedApartment ? `Unidad ${selectedApartment.number}` : ''} readOnly />
              <textarea rows="4" placeholder="Mensaje" />
              <button type="button" className="primary-btn full-width" onClick={() => setShowContact(false)}>
                Solicitar información
              </button>
            </form>
          </div>
        </div>
      )}

      {selectedApartment && (
        <div className="floating-actions">
          <button className="primary-btn" onClick={() => setShowPlan(true)}>Ver plano</button>
          <button className="secondary-btn" onClick={handleExploreUnit}>Explorar</button>
          <button className="ghost-btn" onClick={() => setShowContact(true)}>Consultar</button>
        </div>
      )}
    </div>
  );
}

export default App;
