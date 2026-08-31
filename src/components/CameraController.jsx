import { useFrame, useThree } from '@react-three/fiber';
import { MathUtils } from 'three';

export default function CameraController({ targetPosition, viewMode, focusFloor }) {
  const { camera } = useThree();

  useFrame(() => {
    const target = targetPosition || [0, 8, 18];
    const desired = viewMode === 'interior' ? [0, 2.2, 8.5] : target;

    camera.position.x = MathUtils.lerp(camera.position.x, desired[0], 0.05);
    camera.position.y = MathUtils.lerp(camera.position.y, desired[1], 0.05);
    camera.position.z = MathUtils.lerp(camera.position.z, desired[2], 0.05);

    if (focusFloor && viewMode !== 'interior') {
      const lift = 3 + focusFloor * 0.4;
      camera.position.y = MathUtils.lerp(camera.position.y, lift, 0.06);
    }

    camera.lookAt(0, 5, 0);
  });

  return null;
}
