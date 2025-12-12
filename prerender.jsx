import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { App } from './src/App.jsx';
import React from 'react';

export function prerender(url) {
  const basename = '/';
  
  const html = renderToString(
    <React.StrictMode>
      <StaticRouter basename={basename} location={url}>
        <App />
      </StaticRouter>
    </React.StrictMode>
  );

  return { html };
}
