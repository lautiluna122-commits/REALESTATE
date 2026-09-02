import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/admin.css';

export default function AdminLayout({ children }) {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState('companies');
  const [selectedCompany, setSelectedCompany] = useState(null);

  return (
    <div className="admin-container">
      <aside className="admin-sidebar">
        <div className="admin-header">
          <h1>REALESTATE</h1>
          <p>Admin Panel</p>
        </div>

        <nav className="admin-nav">
          <button
            className={`nav-item ${currentPage === 'companies' ? 'active' : ''}`}
            onClick={() => {
              setCurrentPage('companies');
              setSelectedCompany(null);
              navigate('/admin');
            }}
          >
            🏢 Constructoras
          </button>

          {selectedCompany && (
            <button
              className={`nav-item ${currentPage === 'projects' ? 'active' : ''}`}
              onClick={() => {
                setCurrentPage('projects');
                navigate(`/admin/company/${selectedCompany.id}`);
              }}
            >
              📋 Proyectos
            </button>
          )}

          <div className="nav-separator"></div>
          <div className="nav-label">Herramientas</div>

          <button
            className="nav-item"
            onClick={() => navigate('/')}
          >
            👁️ Ver Showroom
          </button>
        </nav>
      </aside>

      <main className="admin-content">
        <header className="admin-top-bar">
          <div className="top-bar-left">
            {selectedCompany && (
              <div className="breadcrumb">
                <span className="breadcrumb-item">
                  {selectedCompany.name}
                </span>
              </div>
            )}
          </div>
          <div className="top-bar-right">
            <span className="user-info">Admin</span>
          </div>
        </header>

        <div className="admin-main">
          {children}
        </div>
      </main>
    </div>
  );
}
