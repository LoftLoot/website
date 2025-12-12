import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { App } from './src/App.jsx';
import React from 'react';

export function prerender(args) {
  // Determine the URL to prerender
  const url = typeof args === 'string' ? args : (args.route || args.path || '/');
  console.log('[PRERENDER] Input args:', args);
  console.log('[PRERENDER] Resolved URL:', url);

  const basename = '/website/';
  console.log('[PRERENDER] Router basename:', basename);

  // Ensure URL is correctly prefixed with basename
  let location;
  try {
    if (typeof url !== 'string') {
      throw new Error('URL is not a string');
    }

    location = url.startsWith(basename) 
      ? url 
      : basename.replace(/\/$/, '') + (url.startsWith('/') ? url : '/' + url);

    console.log('[PRERENDER] Computed location for StaticRouter:', location);
  } catch (err) {
    console.error('[PRERENDER] Failed to compute location:', err);
    location = basename; // fallback to base
  }

  // Render app to string
  let html;
  try {
    html = renderToString(
      <React.StrictMode>
        <StaticRouter basename={basename} location={location}>
          <App />
        </StaticRouter>
      </React.StrictMode>
    );

    console.log('[PRERENDER] Rendered HTML length:', html.length);
    if (!html || html.length < 50) {
      console.warn('[PRERENDER] HTML output is suspiciously short, likely nothing rendered.');
    }
  } catch (err) {
    console.error('[PRERENDER] Error during renderToString:', err);
    html = '<div id="root"></div>'; // fail gracefully
  }

  return { html };
}
