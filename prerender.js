import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { App } from './src/App';
import React from 'react';

export function prerender(url) {
  // Use the same base as your vite config
  const basename = '/website/';
  
  // Render the app to a string
  const html = renderToString(
    <React.StrictMode>
      <StaticRouter basename={basename} location={url}>
        <App />
      </StaticRouter>
    </React.StrictMode>
  );

  return { html };
}
