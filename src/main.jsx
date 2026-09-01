import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import DemoPortal from './demo/DemoPortal';
import PremiumShowroom from './showroom/PremiumShowroom';
import './index.css';
import './demo/demo.css';
import './showroom/premium.css';

const path = window.location.pathname;
const isAdmin = path === '/admin' || path.startsWith('/admin/');
const isDemo = path === '/demo' || path.startsWith('/demo/');

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {isAdmin ? <DemoPortal /> : isDemo ? <PremiumShowroom /> : <App />}
  </React.StrictMode>,
);
