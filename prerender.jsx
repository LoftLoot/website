import React from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { App } from './src/App.jsx';

/**
 * Prerender function called by vite-prerender-plugin.
 * Always returns { html: string }.
 */
export function prerender(route) {
  // Ensure route is a string
  const url = typeof route === 'string' ? route : (route.route || route.path || '/');

  const basename = '/website/';

  // Prepend basename if not already present
  const location = url.startsWith(basename) ? url : basename.replace(/\/$/, '') + url;

  const html = renderToString(
    <React.StrictMode>
      <StaticRouter basename={basename} location={location}>
        <App />
      </StaticRouter>
    </React.StrictMode>
  );

  return { html };
}
