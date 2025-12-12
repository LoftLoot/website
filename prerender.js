import fs from 'fs';
import path from 'path';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { App } from './src/App.jsx';

const basename = '/website/';

const routes = ['/', '/about', '/contact']; // add your app routes here

routes.forEach((route) => {
  const location = route.startsWith(basename) ? route : basename.replace(/\/$/, '') + route;

  const html = renderToString(
    <React.StrictMode>
      <StaticRouter basename={basename} location={location}>
        <App />
      </StaticRouter>
    </React.StrictMode>
  );

  const outDir = path.resolve('./dist', route === '/' ? '' : route);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'index.html'), html);

  console.log(`[PRERENDER] Wrote HTML for route: ${route}`);
});
