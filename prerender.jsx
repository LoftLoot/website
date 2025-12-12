import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { App } from './src/App.jsx';
import React from 'react';

export function prerender(args) {
  const basename = '/website/';

  // Ensure url is a string
  let url = '/';
  if (typeof args === 'string') {
    url = args;
  } else if (args && (typeof args.route === 'string' || typeof args.path === 'string')) {
    url = args.route || args.path;
  }

  // Prepend basename if missing
  const location = String(url).startsWith(basename)
    ? url
    : basename.replace(/\/$/, '') + (url === '/' ? '' : url);

  const html = renderToString(
    <React.StrictMode>
      <StaticRouter basename={basename} location={location}>
        <App />
      </StaticRouter>
    </React.StrictMode>
  );

  return { html };
}
