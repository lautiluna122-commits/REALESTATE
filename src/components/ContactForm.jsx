import { useState } from 'react';

const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL;
const defaultApiBaseUrl = import.meta.env.DEV ? 'http://localhost:4000/api' : '/api';
const API_BASE_URL = (configuredApiBaseUrl || defaultApiBaseUrl).replace(/\/$/, '');

export default function ContactForm({ projectId, unitId = null, onSuccess }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');

  const updateField = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
    if (status !== 'idle') {
      setStatus('idle');
      setMessage('');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const name = form.name.trim();
    const email = form.email.trim();

    if (!name || !email) {
      setStatus('error');
      setMessage('Completá tu nombre y email.');
      return;
    }

    setStatus('submitting');
    setMessage('');

    try {
      const response = await fetch(`${API_BASE_URL}/projects/${encodeURIComponent(projectId)}/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone: form.phone.trim() || null, message: form.message.trim(), unitId }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || 'No pudimos enviar tus datos.');
      }

      setStatus('success');
      setMessage('Recibimos tu solicitud. Te contactaremos a la brevedad.');
      setForm({ name: '', email: '', phone: '', message: '' });
      onSuccess?.(data);
    } catch (error) {
      setStatus('error');
      setMessage(error.message || 'No pudimos enviar tus datos. Intentá nuevamente.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="contact-form" noValidate>
      <div className="contact-form__field">
        <label htmlFor="contact-name">Nombre</label>
        <input
          id="contact-name"
          name="name"
          type="text"
          value={form.name}
          onChange={updateField('name')}
          autoComplete="name"
          placeholder="Tu nombre"
          minLength={2}
          maxLength={120}
          required
        />
      </div>

      <div className="contact-form__field">
        <label htmlFor="contact-email">Email</label>
        <input
          id="contact-email"
          name="email"
          type="email"
          value={form.email}
          onChange={updateField('email')}
          autoComplete="email"
          placeholder="tu@email.com"
          maxLength={254}
          required
        />
      </div>

      <div className="contact-form__field">
        <label htmlFor="contact-phone">Teléfono</label>
        <input id="contact-phone" name="phone" type="tel" value={form.phone} onChange={updateField('phone')} autoComplete="tel" placeholder="Tu teléfono" maxLength={40} />
      </div>

      <div className="contact-form__field">
        <label htmlFor="contact-message">Mensaje</label>
        <textarea id="contact-message" name="message" value={form.message} onChange={updateField('message')} placeholder="¿Qué te gustaría conocer?" rows="3" />
      </div>

      <button type="submit" disabled={status === 'submitting'}>
        {status === 'submitting' ? 'Enviando…' : 'Quiero más información'}
      </button>

      {message && (
        <p role={status === 'error' ? 'alert' : 'status'} aria-live="polite" data-status={status}>
          {message}
        </p>
      )}

      <style>{`
        .contact-form { display: grid; gap: 14px; width: 100%; max-width: 420px; }
        .contact-form__field { display: grid; gap: 7px; }
        .contact-form label { font-size: 11px; letter-spacing: .08em; text-transform: uppercase; opacity: .65; }
        .contact-form input { width: 100%; padding: 13px 14px; border: 1px solid rgba(22,34,37,.2); background: rgba(255,255,255,.72); color: #162225; font: inherit; outline: none; }
        .contact-form input:focus { border-color: #162225; box-shadow: 0 0 0 2px rgba(22,34,37,.08); }
        .contact-form button { padding: 14px 18px; border: 0; background: #162225; color: #eee8df; font: inherit; font-size: 10px; letter-spacing: .14em; text-transform: uppercase; cursor: pointer; }
        .contact-form button:disabled { opacity: .55; cursor: wait; }
        .contact-form p { margin: 0; font-size: 12px; line-height: 1.5; }
        .contact-form p[data-status="error"] { color: #9b3d35; }
        .contact-form p[data-status="success"] { color: #35664d; }
      `}</style>
    </form>
  );
}
