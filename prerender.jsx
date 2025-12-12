import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { App } from './src/App.jsx';
import React from 'react';

export function prerender(url) {
  const basename = '/website/';
  
  // FIX: Prepend the basename to the URL so the Router recognizes it.
  // If url is "/", location becomes "/website/"
  // If url is "/about", location becomes "/website/about"
  const location = url.startsWith(basename) 
    ? url 
    : basename.replace(/\/$/, '') + url;
  
  const html = renderToString(
    <React.StrictMode>
      <StaticRouter basename={basename} location={location}>
        <App />
      </StaticRouter>
    </React.StrictMode>
  );

  return { html };
}
