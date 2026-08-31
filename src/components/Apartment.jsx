import { useMemo } from 'react';
import { Html } from '@react-three/drei';

export default function Apartment({ apartment, selected, onSelect, hovered, interiorMode }) {
  const statusColor =
    apartment.status === 'Disponible' ? '#70c59d' : apartment.status === 'Reservado' ? '#d4a441' : '#d76b6b';

  const position = useMemo(() => {
    const index = (apartment.number % 10) % 4;
    const x = -3 + (index % 2) * 6;
    const z = index < 2 ? -2.5 : 2.5;
    return [x, apartment.floor * 2.6 + 0.4, z];
  }, [apartment]);

  return (
    <group position={position}>
      <mesh
        castShadow
        receiveShadow
        onClick={(event) => {
          event.stopPropagation();
          onSelect(apartment);
        }}
        onPointerOver={(event) => {
          event.stopPropagation();
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'default';
        }}
      >
        <boxGeometry args={[2.8, 1.2, 2.3]} />
        <meshStandardMaterial
          color={selected ? '#f1d996' : statusColor}
          emissive={selected ? '#7a5d1f' : '#000000'}
          emissiveIntensity={selected ? 0.8 : 0.15}
        />
      </mesh>

      {interiorMode && (
        <Html position={[0, 1.6, 0]} center distanceFactor={14}>
          <div className="unit-tag">{apartment.number}</div>
        </Html>
      )}
    </group>
  );
}
