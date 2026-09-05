import { lazy, Suspense } from 'react';

const ShowroomV4 = lazy(() => import('./experience/ShowroomV4'));

export default function App() {
  return (
    <Suspense fallback={<div style={{ background: '#0b1214', height: '100vh' }} />}>
      <ShowroomV4 />
    </Suspense>
  );
}
