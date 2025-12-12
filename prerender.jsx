import fs from 'fs';
import path from 'path';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { App } from './src/App.jsx';

const DIST_DIR = path.resolve(process.cwd(), 'dist');
const BASENAME = '/website/'; 

const routes = ['/', '/about'];

export async function prerender() {
  // 1. Read the production index.html (contains correct CSS/JS links)
  const templatePath = path.join(DIST_DIR, 'index.html');
  
  if (!fs.existsSync(templatePath)) {
    console.error('Error: dist/index.html not found. You must run BUILD before PRERENDER.');
    process.exit(1);
  }
  
  const template = fs.readFileSync(templatePath, 'utf-8');

  for (const url of routes) {
    // 2. Prepare URL. If url is "/", location becomes "/website/"
    const location = BASENAME.replace(/\/$/, '') + url;

    // 3. Render the App
    const appHtml = ReactDOMServer.renderToString(
      <StaticRouter basename={BASENAME} location={location}>
        <App />
      </StaticRouter>
    );

    // 4. Inject React HTML into the template
    const html = template.replace(
      '<div id="root"></div>', 
      `<div id="root">${appHtml}</div>`
    );

    // 5. Save the file
    const routePath = url === '/' ? 'index.html' : `${url.replace(/^\//, '')}/index.html`;
    const outputPath = path.join(DIST_DIR, routePath);
    const outputDir = path.dirname(outputPath);

    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    fs.writeFileSync(outputPath, html);
    console.log(`Prerendered: ${url} -> ${outputPath}`);
  }
}

prerender();
