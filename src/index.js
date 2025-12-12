import React from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import { App } from './App'; // Named export

const rootElement = document.getElementById('root');
const baseUrl = import.meta.env.BASE_URL || '/website/';

const ClientApp = () => (
  <React.StrictMode>
    <BrowserRouter basename={baseUrl}>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

if (rootElement.hasChildNodes()) {
  hydrateRoot(rootElement, <ClientApp />);
} else {
  const root = createRoot(rootElement);
  root.render(<ClientApp />);
}
