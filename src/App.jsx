import { lazy, Suspense } from 'react';

const ShowroomV4 = lazy(() => import('./experience/ShowroomV4'));

function ShowroomFallback() {
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
      <span>Loading showroom…</span>
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<ShowroomFallback />}>
      <ShowroomV4 />
    </Suspense>
  );
}
