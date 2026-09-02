import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { companiesAPI } from '../services/api';

export default function CompanyList() {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', slug: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadCompanies();
  }, []);

  async function loadCompanies() {
    try {
      setLoading(true);
      const data = await companiesAPI.listAll();
      setCompanies(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateCompany(e) {
    e.preventDefault();
    try {
      setSubmitting(true);
      await companiesAPI.create({
        name: formData.name,
        slug: formData.slug.toLowerCase().trim(),
      });
      setFormData({ name: '', slug: '' });
      setShowModal(false);
      loadCompanies();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="admin-page">
        <div className="page-header">
          <h1>Constructoras</h1>
        </div>
        <div className="empty-state">
          <div className="empty-state-icon">⏳</div>
          <div className="empty-state-text">Cargando...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>Constructoras</h1>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            ➕ Nueva Constructora
          </button>
        </div>
      </div>

      {error && (
        <div style={{
          background: 'rgba(218, 30, 40, 0.1)',
          color: '#da1e28',
          padding: '1rem',
          borderRadius: '0.5rem',
          marginBottom: '1rem',
        }}>
          Error: {error}
        </div>
      )}

      {companies.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🏢</div>
          <div className="empty-state-text">No hay constructoras todavía</div>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Slug</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((company) => (
                <tr key={company.id}>
                  <td><strong>{company.name}</strong></td>
                  <td><code>{company.slug}</code></td>
                  <td>
                    <span className="badge badge-published">{company.status}</span>
                  </td>
                  <td>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => navigate(`/admin/company/${company.id}`)}
                    >
                      Ver Proyectos →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => !submitting && setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Nueva Constructora</h2>
              <button
                className="modal-close"
                onClick={() => setShowModal(false)}
                disabled={submitting}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateCompany}>
              <div className="form-group">
                <label>Nombre</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Ocean Group"
                  required
                  disabled={submitting}
                />
              </div>
              <div className="form-group">
                <label>Slug (URL-friendly)</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="Ej: ocean-group"
                  required
                  disabled={submitting}
                  pattern="[a-z0-9-]+"
                />
                <small style={{ color: '#525252' }}>Solo letras minúsculas, números y guiones</small>
              </div>
              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                  disabled={submitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Creando...' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
