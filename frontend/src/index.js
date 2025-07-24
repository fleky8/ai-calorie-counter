import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './styles/responsive.css'; // Importar estilos responsive
import App from './App';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Registrar el service worker para habilitar funcionalidades PWA
serviceWorkerRegistration.register();