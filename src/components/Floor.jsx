import { useMemo } from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';

export default function Floor({ floor, selectedFloor, selectedApartmentId, onSelectApartment, apartments, buildingView }) {
  const units = apartments.filter((unit) => unit.floor === floor);
  const isActive = selectedFloor === floor;

  const floorLabel = floor === 0 ? 'PB' : floor;

  const positionY = floor === 0 ? 0.5 : floor * 2.6 + 0.9;

  const apartmentMeshes = useMemo(
    () =>
      units.map((unit, index) => {
        const x = -3 + (index % 2) * 6;
        const z = index < 2 ? -2.5 : 2.5;

        const statusColor =
          unit.status === 'Disponible' ? '#7ec5a8' : unit.status === 'Reservado' ? '#d8b15f' : '#d87070';

        const selected = selectedApartmentId === unit.id;
        const isVisible = buildingView === 'all' || selectedFloor === floor || selectedApartmentId === unit.id;

        return (
          <group key={unit.id} position={[x, positionY, z]}>
            <mesh
              castShadow
              receiveShadow
              onClick={(event) => {
                event.stopPropagation();
                onSelectApartment(unit);
              }}
              onPointerOver={(event) => {
                event.stopPropagation();
                document.body.style.cursor = 'pointer';
              }}
              onPointerOut={() => {
                document.body.style.cursor = 'default';
              }}
            >
              <boxGeometry args={[2.8, 1.1, 2.4]} />
              <meshStandardMaterial
                color={selected ? '#e4c27e' : statusColor}
                emissive={selected ? '#5a4c2a' : '#000000'}
                emissiveIntensity={selected ? 0.45 : 0.08}
                roughness={0.75}
                metalness={0.2}
              />
            </mesh>

            {selected && (
              <mesh position={[0, 0.75, 0]}>
                <boxGeometry args={[3.1, 0.25, 2.7]} />
                <meshStandardMaterial color="#f6f1eb" emissive="#d0a14d" emissiveIntensity={0.6} />
              </mesh>
            )}

            {isVisible && (
              <Html position={[0, 1.2, 0]} center distanceFactor={14}>
                <div className="unit-tag">{unit.number}</div>
              </Html>
            )}
          </group>
        );
      }),
    [buildingView, floor, onSelectApartment, positionY, selectedApartmentId, selectedFloor, units],
  );

  return (
    <group>
      <mesh position={[0, positionY - 0.75, 0]} receiveShadow>
        <boxGeometry args={[15, 0.2, 12]} />
        <meshStandardMaterial color={isActive ? '#c1d4da' : '#b7b7b8'} roughness={0.8} metalness={0.15} />
      </mesh>

      {apartmentMeshes}

      {floor !== 0 && (
        <Html position={[0, positionY + 1.3, 0]} center distanceFactor={18}>
          <div className="floor-label">Piso {floorLabel}</div>
        </Html>
      )}
    </group>
  );
}
