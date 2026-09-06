import { Suspense } from 'react';
import { useGLTF } from '@react-three/drei';

function Model({ src, ...props }) {
  const { scene } = useGLTF(src);
  return <primitive object={scene} dispose={null} {...props} />;
}

export default function ShowroomAsset({ src, fallback = null, ...props }) {
  if (!src) return fallback;
  return (
    <Suspense fallback={fallback}>
      <Model src={src} {...props} />
    </Suspense>
  );
}
