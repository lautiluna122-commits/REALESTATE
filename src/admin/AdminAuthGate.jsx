import { useEffect, useState } from 'react';
import { getAuthToken, platformApi, setAuthToken } from '../platform/platformApi';
import './admin-auth.css';

export default function AdminAuthGate({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!getAuthToken()) { setLoading(false); return; }
    platformApi.me().then((session) => setUser(session.user)).catch(() => setAuthToken(null)).finally(() => setLoading(false));
  }, []);

  async function login(event) {
    event.preventDefault();
    setSubmitting(true); setError('');
    try {
      const session = await platformApi.login(email, password);
      setUser(session.user);
    } catch (err) {
      setError(err?.message || 'No se pudo iniciar sesión.');
    } finally { setSubmitting(false); }
  }

  async function logout() {
    await platformApi.logout();
    setUser(null);
  }

  if (loading) return <div className="auth-loading">REALESTATE <span>Verificando acceso…</span></div>;
  if (!user) return (
    <main className="auth-shell">
      <section className="auth-card">
        <div className="auth-mark">RE</div>
        <span className="auth-kicker">REALESTATE / PRIVATE PLATFORM</span>
        <h1>Entrá a tu Studio.</h1>
        <p>El Studio y las herramientas de publicación son privadas. Iniciá sesión para continuar.</p>
        <form onSubmit={login}>
          <label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required placeholder="tu@email.com" /></label>
          <label>Contraseña<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required /></label>
          {error && <div className="auth-error" role="alert">{error}</div>}
          <button disabled={submitting}>{submitting ? 'Ingresando…' : 'Ingresar al Studio →'}</button>
        </form>
      </section>
    </main>
  );

  return <div className="admin-authenticated"><div className="auth-userbar"><span><b>REALESTATE</b> · {user.name} · {user.role}</span><button onClick={logout}>Cerrar sesión</button></div>{children}</div>;
}
