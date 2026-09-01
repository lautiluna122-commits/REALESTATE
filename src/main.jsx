import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import AdminApp from './admin/AdminApp';
import ShowroomPlaceholder from './showroom/ShowroomPlaceholder';
import './index.css';

const pathname = window.location.pathname;
const showroomMatch = pathname.match(/^\/showroom\/([^/]+)$/);
const Root = pathname.startsWith('/admin') ? AdminApp : showroomMatch
  ? () => <ShowroomPlaceholder publicSlug={decodeURIComponent(showroomMatch[1])} />
  : App;

ReactDOM.createRoot(document.getElementById('root')).render(<React.StrictMode><Root /></React.StrictMode>);
