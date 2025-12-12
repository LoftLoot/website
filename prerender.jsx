import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { App } from './src/App.jsx';
import React from 'react';

export function prerender(args) {
  // FIX: The plugin usually passes an object (e.g. { route: '/' }), not a string.
  // We explicitly extract the path string to avoid the Type Error.
  const url = typeof args === 'string' ? args : (args.route || args.path || '/');

  const basename = '/website/';
  
  // FIX: Prepend the basename so the Router matches the URL correctly.
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
