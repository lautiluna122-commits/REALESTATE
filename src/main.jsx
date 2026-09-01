import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import DemoPortal from './demo/DemoPortal';
import './index.css';
import './demo/demo.css';

const isDemoPortal = window.location.pathname === '/demo' || window.location.pathname.startsWith('/demo/');

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {isDemoPortal ? <DemoPortal /> : <App />}
  </React.StrictMode>,
);
