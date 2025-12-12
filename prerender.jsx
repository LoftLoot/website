import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { App } from './src/App.jsx';
import React from 'react';

export function prerender(args) {
  const url = typeof args === 'string' ? args : (args.route || args.path || '/');
  const basename = '/website/';
  const location = url.startsWith(basename)
    ? url
    : basename.replace(/\/$/, '') + url;

  console.log('[PRERENDER] url:', url);
  console.log('[PRERENDER] location:', location);

  let html;
  try {
    html = renderToString(
      <React.StrictMode>
        <StaticRouter basename={basename} location={location}>
          <App />
        </StaticRouter>
      </React.StrictMode>
    );
  } catch (err) {
    console.error('[PRERENDER ERROR]', err);
    html = '';
  }

  console.log('[PRERENDER] html length:', html.length);

  return { html };
}
