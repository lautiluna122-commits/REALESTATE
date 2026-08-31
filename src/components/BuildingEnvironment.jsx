import { Environment, Sky, ContactShadows } from '@react-three/drei';

function Tree({ position }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.9, 0]} castShadow receiveShadow>
        <coneGeometry args={[0.55, 1.4, 10]} />
        <meshStandardMaterial color="#3f7d4f" />
      </mesh>
      <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.08, 0.1, 0.7, 8]} />
        <meshStandardMaterial color="#7d5a3d" />
      </mesh>
    </group>
  );
}

function BuildingBlock({ position, scale = [1, 1, 1] }) {
  return (
    <mesh position={position} scale={scale} castShadow receiveShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#d7d4d0" roughness={0.9} metalness={0.2} />
    </mesh>
  );
}

export default function BuildingEnvironment() {
  return (
    <>
      <Sky distance={450000} sunPosition={[5, 1, 8]} inclination={0.55} azimuth={0.15} />
      <Environment preset="city" />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.18, 0]} receiveShadow>
        <planeGeometry args={[120, 120]} />
        <meshStandardMaterial color="#dfe7d9" />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.08, 0]} receiveShadow>
        <planeGeometry args={[90, 90]} />
        <meshStandardMaterial color="#c6d1bf" />
      </mesh>

      <mesh position={[0, 0.03, 22]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[34, 8]} />
        <meshStandardMaterial color="#b7b7b7" />
      </mesh>

      <mesh position={[0, 0.06, 26]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[20, 2.5]} />
        <meshStandardMaterial color="#d1d1d1" />
      </mesh>

      <Tree position={[-12, 0, 18]} />
      <Tree position={[-8, 0, 15]} />
      <Tree position={[12, 0, 18]} />
      <Tree position={[8, 0, 15]} />
      <Tree position={[-15, 0, -12]} />
      <Tree position={[15, 0, -10]} />

      <BuildingBlock position={[-22, 1.7, -18]} scale={[5.5, 3.4, 4.8]} />
      <BuildingBlock position={[-17, 1.2, -6]} scale={[4.2, 2.4, 4]} />
      <BuildingBlock position={[18, 2.3, -16]} scale={[7, 4.6, 5]} />
      <BuildingBlock position={[20, 1.3, -2]} scale={[5, 2.6, 4.2]} />

      <ContactShadows position={[0, -0.15, 0]} opacity={0.35} scale={60} blur={1.5} far={25} />
    </>
  );
}
