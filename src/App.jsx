import ShowroomV4 from './experience/ShowroomV4';

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error) {
    console.error('Showroom runtime error:', error);
  }

  render() {
    if (this.state.error) {
      return (
        <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 32, background: '#0b1214', color: '#fff', fontFamily: 'Arial, sans-serif' }}>
          <section style={{ maxWidth: 760 }}>
            <p style={{ letterSpacing: '.18em', textTransform: 'uppercase', fontSize: 11, opacity: .6 }}>Ocean Mansions · Showroom</p>
            <h1 style={{ fontSize: 42, fontWeight: 400, margin: '16px 0' }}>Estamos recuperando la experiencia.</h1>
            <p style={{ lineHeight: 1.7, opacity: .72 }}>El navegador encontró un error al iniciar el showroom 3D. La pantalla de diagnóstico está activa para que el fallo no vuelva a presentarse como una pantalla blanca.</p>
            <pre style={{ marginTop: 24, padding: 18, overflow: 'auto', background: '#111b1e', border: '1px solid #26383c', fontSize: 12, whiteSpace: 'pre-wrap' }}>{String(this.state.error?.stack || this.state.error?.message || this.state.error)}</pre>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  return (
    <AppErrorBoundary>
      <ShowroomV4 />
    </AppErrorBoundary>
  );
}
