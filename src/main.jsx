import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import './experience/cinematic.css';
import './experience/design-system.css';
import { getProjectBySlug } from './platform/projectRegistry';
import { getShowroomTheme } from './experience/showroomTheme';

const pathname = typeof window !== 'undefined' ? window.location.pathname.replace(/\/+$/, '') : '/';
const slug = pathname.match(/^\/proyecto\/([^/]+)$/)?.[1] ?? 'ocean-mansions';
const project = getProjectBySlug(slug);
const theme = getShowroomTheme(project);

if (typeof document !== 'undefined') {
  const root = document.documentElement;
  root.style.setProperty('--showroom-primary', theme.branding.primary);
  root.style.setProperty('--showroom-accent', theme.branding.accent);
  root.style.setProperty('--showroom-surface', theme.branding.surface);
  root.style.setProperty('--showroom-ink', theme.branding.ink);
  root.style.setProperty('--showroom-font', theme.typography.font);
  document.title = project.name ? `${project.name} · Digital Property Experience` : 'Real Estate · Digital Property Experience';
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
