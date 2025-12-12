// prerender.jsx
import fs from 'fs';
import path from 'path';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import App from './src/App.jsx';

// Where to write the prerendered HTML
const DIST_DIR = path.resolve(process.cwd(), 'dist');

// All routes to prerender
const routes = ['/', '/about']; // add more routes as needed

// Ensure dist folder exists
if (!fs.existsSync(DIST_DIR)) fs.mkdirSync(DIST_DIR, { recursive: true });

routes.forEach((url) => {
  // Wrap your App in a StaticRouter for SSR
  const appHtml = ReactDOMServer.renderToString(
    <StaticRouter location={url}>
      <App />
    </StaticRouter>
  );

  // Build a simple HTML template
  const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <meta name="theme-color" content="#fffbf0" />
    <meta name="description" content="Loft Loot - Vintage Toys & Collectibles" />
    <title>Loft Loot</title>
    <link rel="stylesheet" href="/assets/index-Bp2FkpuY.css">
    <script type="module" src="/assets/index-l1WCnySZ.js" defer></script>
  </head>
  <body style="background-color: #fffbf0;">
    <div id="root">${appHtml}</div>
  </body>
</html>`;

  // Determine output path
  const outputPath = path.join(DIST_DIR, url === '/' ? '' : url);
  if (!fs.existsSync(outputPath)) fs.mkdirSync(outputPath, { recursive: true });

  fs.writeFileSync(path.join(outputPath, 'index.html'), html, 'utf-8');
  console.log(`Prerendered ${url} -> ${path.join(outputPath, 'index.html')}`);
});
