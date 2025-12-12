import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import prerender from '@prerenderer/rollup-plugin';
import PuppeteerRenderer from '@prerenderer/renderer-puppeteer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Fix for __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to slugify text
const slugify = (text) => {
  return text.toString().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
};

// Read product data
const productsData = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'src/products.json'), 'utf-8'));

// Generate Routes
const routes = ['/', '/about'];

// Add Collections
const collections = new Set(productsData.map(p => p.collection));
collections.forEach(col => {
  if (col) routes.push(`/${slugify(col)}`);
});

// Add Products
productsData.forEach(product => {
  const collectionSlug = slugify(product.collection || "Other");
  const itemSlug = slugify(`${product.releaseDate || 'vintage'}-${product.manufacturer}-${product.name}`);
  routes.push(`/${collectionSlug}/${itemSlug}`);
});

export default defineConfig({
  base: '/website/',
  plugins: [
    react(),
    prerender({
      routes: routes,
      renderer: new PuppeteerRenderer({
        // Wait 500ms for React to mount and data to load
        renderAfterTime: 500,
        // Vital for running in GitHub Actions/CI environments
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      }),
      postProcess(renderedRoute) {
        // Fix absolute paths for GitHub Pages subpath
        renderedRoute.html = renderedRoute.html.replace(
          /http:\/\/localhost:\d+/g,
          'https://LoftLoot.github.io/website'
        );
        return renderedRoute;
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
  }
});
