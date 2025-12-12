import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import React from 'react';
import { App } from './src/App.jsx';
import fs from 'fs';
import path from 'path';

const BASE_PATH = '/website/'; // your homepage base

async function prerender() {
  const routes = ['/', '/about']; // Add any collection/product routes you want prerendered

  for (const route of routes) {
    const location = route.startsWith(BASE_PATH) ? route : BASE_PATH.replace(/\/$/, '') + route;

    let html = '';
    try {
      html = renderToString(
        <React.StrictMode>
          <StaticRouter basename={BASE_PATH} location={location}>
            <App />
          </StaticRouter>
        </React.StrictMode>
      );
    } catch (err) {
      console.error('[PRERENDER ERROR]', err);
    }

    // Wrap with basic HTML shell
    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Loft Loot</title>
</head>
<body>
<div id="root">${html}</div>
<script type="module" src="/src/main.jsx"></script>
</body>
</html>`;

    // Save to dist folder
    const outDir = path.resolve('./dist', route === '/' ? '' : route.slice(1));
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, 'index.html'), fullHtml);
    console.log(`[PRERENDER] Wrote ${route} to ${outDir}/index.html`);
  }
}

prerender();
